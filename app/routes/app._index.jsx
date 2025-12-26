import { useLoaderData } from "react-router";
import { Page, Card, Button, Text } from "@shopify/polaris";
import { useEffect, useState } from "react";

/* -------------------- */
/* LOADER */
/* -------------------- */
export async function loader() {
  console.log("🟢 LOADER CALISTI");
  return {
    orders: [
      {
        id: "1",
        orderName: "#1001",
        email: "test@example.com",
        status: "completed",
      },
    ],
  };
}

/* -------------------- */
/* PAGE */
/* -------------------- */
export default function AppIndex() {
  const { orders } = useLoaderData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    console.log("✅ CLIENT HYDRATED");
  }, []);

  return (
    <Page title="Orders">
      {orders.map((order) => (
        <Card key={order.id} sectioned>
          <Text as="h3">{order.orderName}</Text>
          <Text tone="subdued">{order.email}</Text>

          <Button
            onClick={() => {
              console.log("🔥 BUTTON CLICK");
              setOpen(!open);
            }}
          >
            View Photos
          </Button>

          {open && (
            <Text>Dropdown opened</Text>
          )}
        </Card>
      ))}
    </Page>
  );
}
