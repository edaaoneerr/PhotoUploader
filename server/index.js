import express from "express";
import { createRequestHandler } from "@react-router/express";
import * as build from "../build/server/index.js";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const EXPECTED_PHOTOS = 9;

app.post("/webhooks/orders-paid", async (req, res) => {
  const order = req.body;
  const orderId = order.id;

  const logs = [];
  const log = (msg, data) => {
    logs.push({ time: new Date().toISOString(), msg, data });
  };

  log("ORDER_RECEIVED", { orderId });

  let uploadKey = null;

  for (const item of order.line_items || []) {
    for (const prop of item.properties || []) {
      if (prop.name === "magnet_upload_key") {
        uploadKey = prop.value;
      }
    }
  }

  if (!uploadKey) {
    log("FAILED", { reason: "missing_upload_key" });
    console.table(logs);
    return res.status(200).send("ok");
  }

  log("UPLOAD_KEY_FOUND", { uploadKey });

  const verifyRes = await fetch(
    "https://magnet-upload.kendinehasyazilimci.workers.dev/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: uploadKey,
        expectedCount: EXPECTED_PHOTOS
      })
    }
  );

  const verify = await verifyRes.json();
  log("VERIFY_RESULT", verify);

  if (!verify.ok) {
    log("RETRYABLE", {
      reason: "photos_missing",
      found: verify.found
    });

    console.table(logs);
    return res.status(200).send("retry_pending");
  }

  const finalizeRes = await fetch(
    "https://magnet-upload.kendinehasyazilimci.workers.dev/finalize",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: uploadKey,
        orderId
      })
    }
  );

  const finalize = await finalizeRes.json();
  log("FINALIZE_RESULT", finalize);

  if (finalize.ok) {
    log("COMPLETED", { orderId });
  } else {
    log("FAILED", { reason: finalize.reason });
  }

  console.table(logs);
  res.status(200).send("ok");
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
