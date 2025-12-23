const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";

export async function action({ request }) {
  try {
    const { key, photos } = await request.json();

    if (!key || !photos || !photos.length) {
      return Response.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const res = await fetch(WORKER + "/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        photos
      })
    });

    if (!res.ok) {
      throw new Error("Worker upload failed");
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
