// ----------------------
// DİNAMİK CORS (Shopify için doğru yöntem)
// ----------------------

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  
  // Shopify ve local test için tüm originlere izin ver
  const allowedOrigins = [
    "https://admin.shopify.com",
    "https://photo-uploader-dev.myshopify.com",
    "https://photo-uploader-dev.myshopify.io",
  ];

  // Origin kontrolü - varsa kullan, yoksa wildcard
  const allowOrigin = origin && allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '')))
    ? origin
    : "*"; // Tüm originlere izin ver (development için)

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": allowOrigin !== "*" ? "true" : "false",
    "Vary": "Origin"
  };
}

// CORS ekleme
function withCors(response, corsHeaders) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

// ----------------------
// MAIN WORKER
// ----------------------

export default {
  async fetch(request, env) {
    const cors = getCorsHeaders(request);
    const url = new URL(request.url);

    console.log("🔍 Worker request:", {
      method: request.method,
      pathname: url.pathname,
      origin: request.headers.get("Origin"),
      searchParams: Object.fromEntries(url.searchParams)
    });

    if (request.method === "OPTIONS") {
      console.log("✅ CORS preflight");
      return new Response(null, { status: 204, headers: cors });
    }

    let response;

    if (url.pathname === "/upload" && request.method === "POST") {
      response = await handleUpload(request, env);
    } else if (url.pathname === "/list" && request.method === "GET") {
      response = await handleList(request, env);
    } else if (url.pathname === "/file" && request.method === "GET") {
      response = await handleFile(request, env);
    } else {
      response = new Response("Not found", { status: 404 });
    }

    return withCors(response, cors);
  }
};

// ----------------------
// HELPERS
// ----------------------

function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ----------------------
// UPLOAD
// ----------------------

async function handleUpload(request, env) {
  try {
    const body = await request.json();
    const { key, photos } = body;

    console.log("📤 Upload request:", { key, photoCount: photos?.length });

    if (!key || !Array.isArray(photos)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stored = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      if (!file?.dataUrl) continue;

      const objectKey = `${key}/${i + 1}.jpg`;
      const buffer = dataUrlToBuffer(file.dataUrl);

      await env.R2.put(objectKey, buffer, {
        httpMetadata: { contentType: "image/jpeg" }
      });

      console.log("✅ Stored:", objectKey);
      stored.push(objectKey);
    }

    return new Response(JSON.stringify({ ok: true, key, stored }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// ----------------------
// LIST
// ----------------------

async function handleList(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  console.log("📋 List request for key:", key);

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const list = await env.R2.list({ prefix: `${key}/` });
    const objects = list.objects?.map(o => o.key) || [];

    console.log("✅ Found objects:", objects.length);

    return new Response(JSON.stringify({ key, objects }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("❌ List error:", err);
    return new Response(JSON.stringify({ error: "List failed", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// ----------------------
// FILE
// ----------------------

async function handleFile(request, env) {
  const url = new URL(request.url);
  const objectKey = url.searchParams.get("object");

  console.log("🖼️ File request for:", objectKey);

  if (!objectKey) {
    return new Response("Missing object", { status: 400 });
  }

  try {
    const file = await env.R2.get(objectKey);

    if (!file) {
      console.log("❌ File not found:", objectKey);
      return new Response("Not found", { status: 404 });
    }

    console.log("✅ File found:", objectKey);

    return new Response(file.body, {
      status: 200,
      headers: {
        "Content-Type": file.httpMetadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000"
      }
    });
  } catch (err) {
    console.error("❌ File error:", err);
    return new Response("Internal error", { status: 500 });
  }
}

