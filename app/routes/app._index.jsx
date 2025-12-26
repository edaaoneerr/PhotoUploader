import { useLoaderData } from "@remix-run/react";
import { Page, Card, Button, Text } from "@shopify/polaris";
import { useEffect, useState } from "react";

/* -------------------- */
/* LOADER */
/* -------------------- */
export async function loader() {
  return {
    orders: [
      {
        id: "1",
        orderName: "#1001",
        email: "test@example.com",
        status: "completed",
      },
      {
        id: "2",
        orderName: "#1002",
        email: "test2@example.com",
        status: "retrying",
      },
    ],
  };
}

/* -------------------- */
/* PAGE */
/* -------------------- */
export default function AppIndex() {
  const { orders } = useLoaderData();
  const [open, setOpen] = useState({});

  useEffect(() => {
    console.log("✅ CLIENT HYDRATED");
  }, []);

  return (
    <Page title="Orders">
      {orders.map((order) => (
        <Card key={order.id} sectioned>
          <Text as="h3" variant="headingSm">
            {order.orderName}
          </Text>

          <Text tone="subdued">{order.email}</Text>

          <div style={{ marginTop: 8 }}>
            <Button
              onClick={() => {
                console.log("🔥 CLICK WORKS", order.id);
                alert(`Clicked ${order.orderName}`);
                setOpen((o) => ({ ...o, [order.id]: !o[order.id] }));
              }}
            >
              View Photos
            </Button>
          </div>

          {open[order.id] && (
            <div style={{ marginTop: 12 }}>
              <Text>Photos would open here</Text>
            </div>
          )}
        </Card>
      ))}
    </Page>
  );
}
