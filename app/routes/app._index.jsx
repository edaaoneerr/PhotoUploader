import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  Button,
  Badge,
  InlineStack,
  BlockStack,
  Text
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader() {
  const orders = await getMagnetOrders();
  return { orders };
}

const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";

/* -------------------- */
/* STATUS BADGE */
/* -------------------- */
function StatusBadge({ status }) {
  const toneMap = {
    completed: "success",
    retrying: "attention",
    failed: "critical",
    refunded: "info",
    mailed: "new"
  };

  return <Badge tone={toneMap[status] || "info"}>{status}</Badge>;
}

/* -------------------- */
/* PHOTO GALLERY */
/* -------------------- */
function PhotoGallery({ uploadKey }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uploadKey) return;

    setLoading(true);
    fetch(`${WORKER}/list?key=${encodeURIComponent(uploadKey)}`)
      .then(r => r.json())
      .then(d => setPhotos(d.objects || []))
      .finally(() => setLoading(false));
  }, [uploadKey]);

  if (loading) return <Text>Loading photos…</Text>;
  if (photos.length === 0) return <Text>No photos found.</Text>;

  return (
    <BlockStack gap="300">
      <Button
        onClick={() => {
          photos.forEach((p, i) => {
            const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;
            const a = document.createElement("a");
            a.href = url;
            a.download = `photo_${i + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
        }}
      >
        Download all
      </Button>

      <InlineStack gap="300" wrap>
        {photos.map((p, i) => {
          const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;

          return (
            <Card key={p}>
              <BlockStack gap="200">
                <img
                  src={url}
                  style={{ width: 120, borderRadius: 6 }}
                  onClick={() => window.open(url, "_blank")}
                />
                <Button
                  size="slim"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `photo_${i + 1}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  Download
                </Button>
              </BlockStack>
            </Card>
          );
        })}
      </InlineStack>
    </BlockStack>
  );
}

/* -------------------- */
/* MAIN PAGE */
/* -------------------- */
export default function AppIndex() {
  const { orders } = useLoaderData();

  const [openPhotos, setOpenPhotos] = useState({});
  const [openLogs, setOpenLogs] = useState({});
  const [showHidden, setShowHidden] = useState(false);

  const visibleOrders = orders.filter(o =>
    showHidden ? true : !o.hidden
  );

  return (
    <Page
      title="Orders"
      primaryAction={{
        content: showHidden ? "Hide hidden orders" : "Show hidden orders",
        onAction: () => setShowHidden(v => !v)
      }}
    >
      <BlockStack gap="400">
        {visibleOrders.map(order => (
          <Card key={order.id}>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <BlockStack>
                  <Text as="h3" variant="headingSm">
                    {order.orderName}
                  </Text>
                  <Text tone="subdued">
                    {order.customerName || "No name"} · {order.email}
                  </Text>
                  <InlineStack gap="200">
                    <StatusBadge status={order.status} />
                    <Text tone="subdued">
                      {order.photosCount} photos
                    </Text>
                  </InlineStack>
                </BlockStack>

                <InlineStack gap="200">
                  <Button
                    onClick={() =>
                      setOpenPhotos(p => ({
                        ...p,
                        [order.id]: !p[order.id]
                      }))
                    }
                  >
                    View photos
                  </Button>

                  <Button
                    onClick={() =>
                      setOpenLogs(l => ({
                        ...l,
                        [order.id]: !l[order.id]
                      }))
                    }
                  >
                    See logs
                  </Button>

                  <Button tone="critical">
                    Hide
                  </Button>
                </InlineStack>
              </InlineStack>

              {openPhotos[order.id] && order.uploadKey && (
                <PhotoGallery uploadKey={order.uploadKey} />
              )}

              {openLogs[order.id] && (
                <BlockStack gap="100">
                  {order.logs.map(log => (
                    <Text key={log.id} as="p">
                      <strong>{log.type}</strong>{" "}
                      · {new Date(log.createdAt).toLocaleString()}
                      {log.message && ` — ${log.message}`}
                    </Text>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        ))}
      </BlockStack>
    </Page>
  );
}
