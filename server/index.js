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

app.post("/webhooks/orders-paid", (req, res) => {
  console.log("🟢 ORDERS PAID WEBHOOK RECEIVED");
  console.log("Order ID:", req.body?.id);

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
