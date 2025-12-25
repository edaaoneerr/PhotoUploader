import prismaDefault, { prisma as prismaNamed } from "../db.server";

export async function getMagnetOrders() {
  console.log("🧪 prismaDefault:", prismaDefault);
  console.log("🧪 prismaNamed:", prismaNamed);

  const prisma = prismaDefault || prismaNamed;

  if (!prisma) {
    throw new Error("PRISMA IS UNDEFINED");
  }

  return prisma.order.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
}


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
