import {
  Page,
  Card,
  Button,
  Text,
  InlineStack,
  BlockStack,
  Badge,
  Divider
} from "@shopify/polaris";
import { useState } from "react";

function StatusBadge({ status }) {
  const toneMap = {
    completed: "success",
    retrying: "warning",
    failed: "critical",
    refunded: "info",
  };

  return (
    <Badge tone={toneMap[status] || "subdued"}>
      {status}
    </Badge>
  );
}

export default function AppIndex() {
  const [openOrderId, setOpenOrderId] = useState(null);

  // ŞİMDİLİK MOCK DATA
  const orders = [
    {
      id: "1",
      orderName: "#1001",
      email: "test1@example.com",
      status: "completed",
      photos: ["photo1.jpg", "photo2.jpg", "photo3.jpg"],
    },
    {
      id: "2",
      orderName: "#1002",
      email: "test2@example.com",
      status: "retrying",
      photos: ["photoA.jpg", "photoB.jpg"],
    },
  ];

  return (
    <Page title="Orders">
      <BlockStack gap="400">
        {orders.map((order) => {
          const isOpen = openOrderId === order.id;

          return (
            <Card key={order.id}>
              <BlockStack gap="200">
                {/* HEADER */}
                <InlineStack align="space-between">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      {order.orderName}
                    </Text>
                    <Text tone="subdued">{order.email}</Text>
                  </BlockStack>

                  <StatusBadge status={order.status} />
                </InlineStack>

                <Divider />

                {/* ACTIONS */}
                <InlineStack gap="200">
                  <Button
                    onClick={() =>
                      setOpenOrderId(isOpen ? null : order.id)
                    }
                  >
                    View Photos
                  </Button>

                  <Button tone="critical" variant="secondary">
                    Hide
                  </Button>
                </InlineStack>

                {/* DROPDOWN */}
                {isOpen && (
                  <BlockStack gap="150">
                    <Divider />
                    <Text tone="subdued">
                      Photos ({order.photos.length})
                    </Text>

                    <InlineStack gap="200">
                      {order.photos.map((p) => (
                        <Card key={p} padding="200">
                          <Text>{p}</Text>
                        </Card>
                      ))}
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          );
        })}
      </BlockStack>
    </Page>
  );
}

