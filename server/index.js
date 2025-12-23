import express from "express";
import { createRequestHandler } from "@react-router/express";
import * as build from "../build/server/index.js";

const app = express();

/* -------------------- */
/* SHOPIFY WEBHOOK */
/* -------------------- */
app.use((req, res, next) => {
  console.log("🔥 INCOMING:", req.method, req.url);
  next();
});


app.use(express.json({ limit: "50mb" }));

app.post("/api/stash-photos", async (req, res) => {
  try {
    const { key, photos } = req.body;

    if (!key || !photos || !photos.length) {
      return res.status(400).json({ error: "invalid payload" });
    }

    console.log("📦 STASH PHOTOS:", key, photos.length);

    // ŞİMDİLİK RAM'DE TUTACAĞIZ (birazdan DB'ye alacağız)
    global.__PHOTO_STASH__ ??= {};
    global.__PHOTO_STASH__[key] = photos;

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ STASH ERROR", err);
    res.status(500).json({ error: "stash failed" });
  }
});

app.use("/webhooks/orders-paid", express.json());

app.post("/webhooks/orders-paid", async (req, res) => {
  try {
    const order = req.body;

    console.log("🟢 ORDER PAID:", order.id);

    let uploadKey = null;

    for (const item of order.line_items || []) {
      for (const prop of item.properties || []) {
        if (prop.name === "magnet_upload_key") {
          uploadKey = prop.value;
        }
      }
    }

    if (!uploadKey) {
      console.warn("⚠️ magnet_upload_key bulunamadı");
      return res.status(200).send("no magnet key");
    }

    console.log("🧲 magnet_upload_key:", uploadKey);

    // DEVAM EDECEĞİZ
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error", err);
    res.status(500).send("error");
  }
});

const photos = global.__PHOTO_STASH__?.[uploadKey];

if (!photos) {
  console.error("❌ Photos not found for", uploadKey);
  return res.status(200).send("no photos");
}

console.log("🖼 Photos ready:", photos.length);


/* -------------------- */
/* REACT ROUTER HANDLER */
/* -------------------- */

app.all(
  "*",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV
  })
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
