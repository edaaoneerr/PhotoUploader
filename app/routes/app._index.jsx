import { useLoaderData } from "react-router";
import { Page, Card, Button, Text } from "@shopify/polaris";
import { getMagnetOrders } from "./api.magnet-orders";

const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";

// --------------------
// Loader: Shopify'dan order verilerini alır
// --------------------
export async function loader({ request }) {
  const orders = await getMagnetOrders(request);
  return { orders };
}

export default function Index() {
  const { orders } = useLoaderData();



  return (
    <Page title="">
      <Card>
        <div style={{ padding: 20 }}>
          {/* JSZip Library for folder download */}
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
          
          {/* AUTO-FIX SCRIPT */}
          <script dangerouslySetInnerHTML={{__html: `
            if (!window.photoGalleryFixed) {
              window.photoGalleryFixed = true;
              window.fixedButtons = new Set();
              window.openGalleries = {};
              
              const WORKER = '${WORKER}';
              
              // Download single file
              window.downloadFile = async (url, filename) => {
                try {
                  const res = await fetch(url);
                  const blob = await res.blob();
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                } catch (e) {
                  alert('Download failed: ' + e.message);
                }
              };
              
              // Download all files as folder (ZIP)
              window.downloadAll = async (key, orderName, objects) => {
                const btn = event.target;
                const originalText = btn.textContent;
                
                try {
                  if (typeof JSZip === 'undefined') {
                    alert('Loading download library...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (typeof JSZip === 'undefined') {
                      throw new Error('Download library not loaded. Please refresh the page.');
                    }
                  }
                  
                  btn.textContent = 'Preparing...';
                  btn.disabled = true;
                  
                  const zip = new JSZip();
                  const folder = zip.folder(orderName);
                  
                  // Download all images and add to folder
                  for (let i = 0; i < objects.length; i++) {
                    btn.textContent = 'Adding ' + (i + 1) + '/' + objects.length;
                    
                    const obj = objects[i];
                    const url = WORKER + '/file?object=' + encodeURIComponent(obj);
                    const filename = 'photo_' + (i + 1) + '.jpg';
                    
                    const res = await fetch(url);
                    const blob = await res.blob();
                    folder.file(filename, blob);
                  }
                  
                  // Generate ZIP
                  btn.textContent = 'Creating folder...';
                  const zipBlob = await zip.generateAsync({ 
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                  });
                  
                  // Download ZIP
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(zipBlob);
                  link.download = orderName + '.zip';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  
                } catch (e) {
                  alert('Download failed: ' + e.message);
                } finally {
                  btn.textContent = originalText;
                  btn.disabled = false;
                }
              };
              
              const startFix = () => {
                if (window.photoGalleryInterval) clearInterval(window.photoGalleryInterval);
                
                window.photoGalleryInterval = setInterval(() => {
                  document.querySelectorAll('button').forEach((btn) => {
                    const btnText = btn.textContent.trim();
                    
                    if (btnText === 'View Photos') {
                      const row = btn.closest('tr');
                      const cells = row?.querySelectorAll('td');
                      const orderName = cells?.[0]?.textContent?.trim();
                      const key = cells?.[3]?.textContent?.trim();
                      
                      if (key && key !== 'NO KEY' && !window.fixedButtons.has(key)) {
                        window.fixedButtons.add(key);
                        
                        // Add Download All button next to View Photos
                        const btnContainer = btn.parentNode;
                        let downloadAllBtn = btnContainer.querySelector('.download-all-btn-' + key);
                        
                        if (!downloadAllBtn) {
                          downloadAllBtn = document.createElement('button');
                          downloadAllBtn.className = 'download-all-btn-' + key;
                          downloadAllBtn.textContent = 'Download All';
                          downloadAllBtn.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #F74551; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;';
                          
                          downloadAllBtn.onclick = async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const origText = downloadAllBtn.textContent;
                            
                            try {
                              if (typeof JSZip === 'undefined') {
                                alert('Loading download library...');
                                await new Promise(resolve => setTimeout(resolve, 1000));
                              }
                              
                              downloadAllBtn.textContent = 'Loading...';
                              downloadAllBtn.disabled = true;
                              
                              const res = await fetch(WORKER + '/list?key=' + encodeURIComponent(key));
                              const data = await res.json();
                              const objects = data.objects || [];
                              
                              const zip = new JSZip();
                              const folder = zip.folder(orderName);
                              
                              for (let i = 0; i < objects.length; i++) {
                                downloadAllBtn.textContent = 'Adding ' + (i + 1) + '/' + objects.length;
                                
                                const obj = objects[i];
                                const url = WORKER + '/file?object=' + encodeURIComponent(obj);
                                const filename = 'photo_' + (i + 1) + '.jpg';
                                
                                const fetchRes = await fetch(url);
                                const blob = await fetchRes.blob();
                                folder.file(filename, blob);
                              }
                              
                              downloadAllBtn.textContent = 'Creating folder...';
                              const zipBlob = await zip.generateAsync({ type: 'blob' });
                              
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(zipBlob);
                              link.download = orderName + '.zip';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(link.href);
                              
                            } catch (err) {
                              alert('Download failed: ' + err.message);
                            } finally {
                              downloadAllBtn.textContent = origText;
                              downloadAllBtn.disabled = false;
                            }
                          };
                          
                          btnContainer.insertBefore(downloadAllBtn, btn.nextSibling);
                        }
                        
                        btn.onclick = async () => {
                          const galleryId = 'gallery-' + key;
                          let gallery = document.getElementById(galleryId);
                          
                          // Toggle gallery
                          if (gallery) {
                            gallery.style.display = gallery.style.display === 'none' ? 'table-row' : 'none';
                            btn.textContent = gallery.style.display === 'none' ? 'View Photos' : 'Hide Photos';
                            return;
                          }
                          
                          // Create new gallery
                          btn.textContent = 'Loading...';
                          btn.disabled = true;
                          
                          try {
                            const res = await fetch(WORKER + '/list?key=' + encodeURIComponent(key));
                            const data = await res.json();
                            const objects = data.objects || [];
                            
                            window.openGalleries[key] = objects;
                            
                            // Create tr wrapper for gallery
                            const galleryRow = document.createElement('tr');
                            galleryRow.id = galleryId;
                            
                            const galleryCell = document.createElement('td');
                            galleryCell.colSpan = 5;
                            galleryCell.style.cssText = 'padding: 0 !important;';
                            
                            gallery = document.createElement('div');
                            gallery.style.cssText = 'margin: 0; padding: 20px; background: #f9fafb; border-left: 4px solid #008060;';
                            
                            gallery.innerHTML = \`
                              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; max-width: 900px; margin: 0 auto;">
                                \${objects.map((obj, i) => {
                                  const url = WORKER + '/file?object=' + encodeURIComponent(obj);
                                  return \`
                                    <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                                      <div style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; border-radius: 6px; background: #f0f0f0;">
                                        <img src="\${url}" 
                                          alt="Photo \${i + 1}"
                                          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                                          onclick="window.open('\${url}', '_blank')"
                                          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'100\\' height=\\'100\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3EError%3C/text%3E%3C/svg%3E'" />
                                      </div>
                                      <button onclick="window.downloadFile('\${url}', '\${orderName}_\${i + 1}.jpg')" 
                                        style="width: 100%; padding: 6px; margin-top: 8px; background: #F74551; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
                                        Download
                                      </button>
                                    </div>
                                  \`;
                                }).join('')}
                              </div>
                            \`;
                            
                            galleryCell.appendChild(gallery);
                            galleryRow.appendChild(galleryCell);
                            row.parentNode.insertBefore(galleryRow, row.nextSibling);
                          } catch (e) {
                            alert('Error: ' + e.message);
                          } finally {
                            btn.textContent = 'Hide Photos';
                            btn.disabled = false;
                          }
                        };
                      }
                    }
                  });
                }, 500);
              };
              
              setTimeout(startFix, 500);
            }
          `}} />

          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#303030" }}>
            Orders
          </h2>

          {orders.length === 0 && <Text>No orders found.</Text>}

          {orders.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
              <thead>
                <tr style={{ background: "#f6f6f7" }}>
                  <th style={{ padding: "12px 15px", textAlign: "left", fontWeight: 600, color: "#303030", borderRadius: "8px 0 0 8px", fontSize: "14px" }}>Order</th>
                  <th style={{ padding: "12px 15px", textAlign: "left", fontWeight: 600, color: "#303030" }}>Email</th>
                  <th style={{ padding: "12px 15px", textAlign: "left", fontWeight: 600, color: "#303030" }}>Item</th>
                  <th style={{ padding: "12px 15px", textAlign: "left", fontWeight: 600, color: "#303030" }}>Key</th>
                  <th style={{ padding: "12px 15px", textAlign: "center", fontWeight: 600, color: "#303030", borderRadius: "0 8px 8px 0" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o, i) => (
                  <tr key={i} style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", transition: "all 0.2s" }}>
                    <td style={{ padding: "15px", borderRadius: "8px 0 0 8px", fontWeight: 500, color: "#F74551" }}>{o.orderName}</td>
                    <td style={{ padding: "15px", color: "#666", fontSize: "14px" }}>{o.email}</td>
                    <td style={{ padding: "15px", color: "#303030", fontSize: "14px" }}>{o.itemName}</td>
                    <td style={{ padding: "15px", fontSize: "11px", color: "#999", fontFamily: "monospace", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.key}</td>

                    <td style={{ padding: "15px", textAlign: "center", borderRadius: "0 8px 8px 0" }}>
                      {o.key && o.key !== "NO KEY" ? (
                        <button style={{ padding: "8px 16px", background: "#F74551", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
                          View Photos
                        </button>
                      ) : (
                        <Text tone="subdued">No key</Text>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Gallery will be dynamically inserted here by useEffect */}
          <div id="photo-gallery-container"></div>
        </div>
      </Card>
    </Page>
  );
}
