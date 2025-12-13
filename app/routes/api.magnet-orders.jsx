// app/routes/api.magnet-orders.jsx
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader({ request }) {
  console.log("api.magnet-orders LOADER HIT");

  const orders = await getMagnetOrders(request);

  return new Response(JSON.stringify(orders), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
