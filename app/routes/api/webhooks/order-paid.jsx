const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";

export async function action({ request }) {
  try {
    const order = await request.json();

    let magnetKey = null;

    for (const item of order.line_items || []) {
      if (!item.properties) continue;

      const prop = item.properties.find(
        (p) => p.name === "magnet_upload_key"
      );

      if (prop?.value) {
        magnetKey = prop.value;
        break;
      }
    }

    if (!magnetKey) {
      console.log("ℹ️ No magnet key, skipping upload");
      return Response.json({ skipped: true });
    }

    // ⚠️ BURADA SADECE ÖRNEK
    // Bu fonksiyon SENİN backend cache'inden gelecek
    const photos = await getPhotosForKey(magnetKey);

    if (!photos || !photos.length) {
      console.warn("⚠️ No photos found for key:", magnetKey);
      return Response.json({ error: "No photos" }, { status: 400 });
    }

    const res = await fetch(WORKER + "/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: magnetKey,
        photos
      })
    });

    if (!res.ok) {
      throw new Error("Worker upload failed");
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
