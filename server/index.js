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


    const res =  await fetch("https://magnet-upload.kendinehasyazilimci.workers.dev/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            key: uploadKey,
            orderId: order.id
        })
        });

    const text = await res.text();
    console.log("FINALIZE RESULT", res.status, text);

    if (!res.ok) {
      throw new Error("Finalize failed");
    }
    
    res.status(200).send("ok");

  } catch (err) {
    console.error("❌ Webhook error", err);
    res.status(500).send("error");
  }
});

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
