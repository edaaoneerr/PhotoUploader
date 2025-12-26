import { json } from "react-router";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const EXPECTED_PHOTOS = 9;
const WORKER_BASE = "https://magnet-upload.kendinehasyazilimci.workers.dev";

export async function action({ request }) {
  const order = await request.json();
  const orderId = String(order.id);

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
    return json({ ok: true });
  }

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

  const verifyRes = await fetch(`${WORKER_BASE}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: uploadKey,
      expectedCount: EXPECTED_PHOTOS
    })
  });

  const verify = await verifyRes.json();

  await prisma.order.update({
    where: { id: orderId },
    data: { photosCount: verify.found }
  });

  if (!verify.ok) {
    return json({ status: "retrying" });
  }

  const finalizeRes = await fetch(`${WORKER_BASE}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: uploadKey,
      orderId
    })
  });

  const finalize = await finalizeRes.json();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: finalize.ok ? "completed" : "failed"
    }
  });

  return json({ ok: true });
}
