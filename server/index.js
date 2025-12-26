import express from "express";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import { createRequestHandler } from "@react-router/express";
import * as build from "../build/server/index.js";

const WORKER_BASE = "https://magnet-upload.kendinehasyazilimci.workers.dev";
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const EXPECTED_PHOTOS = 9;

app.post("/webhooks/orders-paid", async (req, res) => {
  const order = req.body;
  const orderId = String(order.id);

  /* -------------------- */
  /* 1. uploadKey bul */
  /* -------------------- */
  let uploadKey = null;

  for (const item of order.line_items || []) {
    for (const prop of item.properties || []) {
      if (prop.name === "magnet_upload_key") {
        uploadKey = prop.value;
      }
    }
  }

  if (!uploadKey) {
    await prisma.orderLog.create({
      data: {
        orderId,
        type: "FAILED",
        message: "missing_upload_key"
      }
    });
    return res.status(200).send("ok");
  }

  /* -------------------- */
  /* 2. Order oluştur */
  /* -------------------- */
  await prisma.order.upsert({
    where: { id: orderId },
    update: {},
    create: {
      id: orderId,
      orderName: order.name,
      email: order.email,
      customerName: order.customer
        ? `${order.customer.first_name} ${order.customer.last_name}`
        : null,
      status: "retrying",
      uploadKey,
      photosCount: 0
    }
  });

  await prisma.orderLog.create({
    data: {
      orderId,
      type: "ORDER_RECEIVED"
    }
  });

  /* -------------------- */
  /* 3. Verify */
  /* -------------------- */
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

  await prisma.orderLog.create({
    data: {
      orderId,
      type: "VERIFY_RESULT",
      payload: verify
    }
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { photosCount: verify.found }
  });

  if (!verify.ok) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "retrying" }
    });
    return res.status(200).send("retry_pending");
  }

  /* -------------------- */
  /* 4. Finalize */
  /* -------------------- */
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

  await prisma.orderLog.create({
    data: {
      orderId,
      type: "FINALIZE_RESULT",
      payload: finalize
    }
  });

  if (finalize.ok) {
    const listRes = await fetch(
      `${WORKER_BASE}/list?key=${encodeURIComponent(uploadKey)}`
    );
    const listData = await listRes.json();
    const finalCount = listData.objects?.length || 0;

    await prisma.order.update({
      where: { id: String(orderId) },
      data: {
        status: "completed",
        photosCount: finalCount
      }
    });

  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "failed" }
    });
  }

  res.status(200).send("ok");
});

app.all("*", createRequestHandler({
  build,
  mode: process.env.NODE_ENV
}));

app.listen(process.env.PORT || 3000);
