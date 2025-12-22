import { json } from "@react-router/node";

const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";

export async function action({ request }) {
  try {
    const { key, photos } = await request.json();

    if (!key || !photos || !photos.length) {
      return json({ error: "Invalid payload" }, { status: 400 });
    }

    for (let i = 0; i < photos.length; i++) {
      const res = await fetch(WORKER + "/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          index: i,
          dataUrl: photos[i],
        }),
      });

      if (!res.ok) {
        throw new Error("Worker upload failed");
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return json({ error: err.message }, { status: 500 });
  }
}
