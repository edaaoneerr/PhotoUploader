import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getMagnetOrders() {
  const orders = await prisma.order.findMany({
    where: {
      hidden: false
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      logs: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  return orders.map(o => ({
    id: o.id,
    orderName: o.orderName,
    email: o.email,
    customerName: o.customerName,
    status: o.status,
    photosCount: o.photosCount,
    uploadKey: o.uploadKey,
    logs: o.logs
  }));
}
