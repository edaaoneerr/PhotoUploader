// app/routes/api.magnet-orders.jsx
import { authenticate } from "../shopify.server";

const WORKER_BASE = "https://magnet-upload.kendinehasyazilimci.workers.dev";

// Utility fonksiyon - hem API route'unda hem de diğer route'larda kullanılabilir
export async function getMagnetOrders(request) {
  try {
    console.log("🔐 Authenticating...");
    const { admin, session } = await authenticate.admin(request);
    console.log("✅ Authentication successful");
    console.log("🔍 Session details:", {
      hasSession: !!session,
      shop: session?.shop || 'NOT FOUND',
      hasAccessToken: !!session?.accessToken,
    });
    
    console.log("🔍 Fetching orders from Shopify...");
    
    // Shopify'dan siparişleri çek
    // Önce basit query ile tüm siparişleri alalım, sonra REST API ile properties'e erişelim
    const response = await admin.graphql(`
      query getOrdersWithMagnetKeys {
        orders(first: 250, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              email
              createdAt
              legacyResourceId
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    name
                    variant {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const data = await response.json();
    
    // Hata kontrolü
    if (data.errors) {
      console.error("❌ GraphQL Errors:", JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }

    if (!data.data) {
      console.error("❌ No data in GraphQL response:", JSON.stringify(data, null, 2));
      throw new Error("No data in GraphQL response");
    }

    const orders = data.data?.orders?.edges || [];
    console.log(`✅ Found ${orders.length} orders total`);
    
    // Test için: Tüm siparişleri logla
    if (orders.length > 0) {
      console.log("📋 First order sample:", JSON.stringify(orders[0]?.node, null, 2));
    }

    // Her sipariş için magnet_upload_key'i bul ve sipariş verilerini formatla
    const magnetOrders = [];

    for (const orderEdge of orders) {
      const order = orderEdge.node;
      let magnetKey = null;
      let itemName = null;

      // REST API ile sipariş detaylarını çek (properties için)
      try {
        const orderId = order.legacyResourceId || order.id.split("/").pop();
        
        // Session bilgilerini kontrol et - authenticate.admin'dan gelen session'ı kullan
        const shop = session?.shop || session?.shopDomain;
        const accessToken = session?.accessToken;
        
        console.log(`🔍 Session info for order ${order.name}:`, {
          hasSession: !!session,
          shop: shop || 'NOT FOUND',
          hasAccessToken: !!accessToken,
        });
        
        if (!shop || !accessToken) {
          console.warn(`⚠️ Missing shop or access token for order ${order.name}`);
          console.warn(`⚠️ Shop: ${shop}, AccessToken: ${accessToken ? 'EXISTS' : 'MISSING'}`);
        } else {
          console.log(`🔍 Fetching REST API details for order ${order.name} (ID: ${orderId}, Shop: ${shop})`);
          
          // REST API ile sipariş detaylarını çek
          const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
          const restUrl = `https://${shopDomain}/admin/api/2024-10/orders/${orderId}.json`;
          
          console.log(`🔗 REST API URL: ${restUrl}`);
          
          const restResponse = await fetch(restUrl, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          });

          console.log(`📡 REST API Response status: ${restResponse.status} for order ${order.name}`);

          if (restResponse.ok) {
            const restData = await restResponse.json();
            const restOrder = restData.order;

            // Tüm order verisini logla (debug için)
            console.log(`📋 Full REST API response for order ${order.name}:`, JSON.stringify(restOrder, null, 2));

            if (restOrder && restOrder.line_items) {
              console.log(`📦 REST API - Order ${order.name} has ${restOrder.line_items.length} line items`);
              
              for (const lineItem of restOrder.line_items) {
                console.log(`🔍 Checking line item: ${lineItem.title || lineItem.name || 'Unknown'}`);
                console.log(`🔍 Line item full data:`, JSON.stringify(lineItem, null, 2));
                
                // Properties kontrolü - hem array hem de object formatını destekle
                if (lineItem.properties && lineItem.properties.length > 0) {
                  const propertiesArray = Array.isArray(lineItem.properties) 
                    ? lineItem.properties 
                    : Object.keys(lineItem.properties).map(key => ({
                        name: key,
                        value: lineItem.properties[key]
                      }));
                  
                  console.log(`🔑 Properties for order ${order.name}, line item:`, JSON.stringify(propertiesArray, null, 2));
                  
                  const magnetKeyProperty = propertiesArray.find(
                    (prop) => prop.name === "magnet_upload_key"
                  );

                  if (magnetKeyProperty && magnetKeyProperty.value) {
                    magnetKey = magnetKeyProperty.value;
                    itemName = lineItem.title || lineItem.name || "Custom Photo Magnets";
                    console.log(`✅ Found magnet key: ${magnetKey} for order ${order.name}`);
                    break;
                  } else {
                    console.log(`⚠️ magnet_upload_key not found in properties for order ${order.name}`);
                    console.log(`⚠️ Available property names:`, propertiesArray.map(p => p.name).join(', '));
                  }
                } else {
                  console.log(`⚠️ Line item has no properties (empty array or null) for order ${order.name}`);
                  
                  // Alternatif olarak order note veya note_attributes'ı kontrol et
                  if (restOrder.note_attributes && restOrder.note_attributes.length > 0) {
                    console.log(`🔍 Checking note_attributes for order ${order.name}:`, JSON.stringify(restOrder.note_attributes, null, 2));
                    const magnetKeyAttr = restOrder.note_attributes.find(
                      (attr) => attr.name === "magnet_upload_key"
                    );
                    if (magnetKeyAttr && magnetKeyAttr.value) {
                      magnetKey = magnetKeyAttr.value;
                      console.log(`✅ Found magnet key in note_attributes: ${magnetKey} for order ${order.name}`);
                    }
                  }
                  
                  // Order note'u kontrol et
                  if (restOrder.note) {
                    console.log(`🔍 Order note for ${order.name}:`, restOrder.note);
                  }
                }
              }
            } else {
              console.warn(`⚠️ REST API - Order ${order.name} has no line_items`);
            }
          } else {
            const errorText = await restResponse.text();
            console.warn(`⚠️ REST API returned ${restResponse.status} for order ${order.name}:`, errorText);
          }
        }
      } catch (restError) {
        console.error(`❌ REST API error for order ${order.name}:`, restError.message);
        console.error(`❌ REST API error stack:`, restError.stack);
      }

      // Eğer bu siparişte magnet_upload_key varsa listeye ekle
      // TEST MODU: Key yoksa bile siparişi göster (debug için)
      const shouldInclude = magnetKey || true; // Geçici: tüm siparişleri göster
      
      if (shouldInclude) {
        // Cloudflare'den bu key için fotoğraf sayısını kontrol et (opsiyonel)
        let photoCount = 0;
        if (magnetKey) {
          try {
            const cloudflareResponse = await fetch(
              `${WORKER_BASE}/list?key=${encodeURIComponent(magnetKey)}`
            );
            if (cloudflareResponse.ok) {
              const cloudflareData = await cloudflareResponse.json();
              photoCount = cloudflareData.objects?.length || 0;
            }
          } catch (err) {
            console.error(`Cloudflare'den fotoğraf sayısı alınırken hata (key: ${magnetKey}):`, err);
          }
        }

        // İlk line item'ı al (key yoksa bile göster)
        if (!itemName && order.lineItems.edges.length > 0) {
          itemName = order.lineItems.edges[0].node.title || 
                     order.lineItems.edges[0].node.name || 
                     "Unknown Item";
        }

        magnetOrders.push({
          orderName: order.name || `#${order.id.split("/").pop()}`,
          email: order.email || "N/A",
          itemName: itemName || "N/A",
          key: magnetKey || "NO KEY",
          createdAt: order.createdAt,
          photoCount: photoCount,
        });
      }
    }

    console.log(`✅ Found ${magnetOrders.length} orders with magnet_upload_key`);
    return magnetOrders;
  } catch (error) {
    console.error("❌ Shopify'dan siparişler çekilirken hata:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Hata detaylarını fırlat ki loader yakalayabilsin
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
}

export async function loader({ request }) {
  console.log("api.magnet-orders LOADER HIT");
  
  const orders = await getMagnetOrders(request);

  return new Response(JSON.stringify(orders), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
