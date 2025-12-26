import { useLoaderData } from "react-router";
import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  Badge,
  InlineStack,
  BlockStack,
  Divider,
  Spinner
} from "@shopify/polaris";
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
    mailed: "info"
  };

  return (
    <Badge tone={toneMap[status] || "neutral"}>
      {status}
    </Badge>
  );
}

/* -------------------- */
/* PHOTO GALLERY */
/* -------------------- */
function PhotoGallery({ uploadKey }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch(
        `${WORKER}/list?key=${encodeURIComponent(uploadKey)}`
      );
      const data = await res.json();
      if (!cancelled) {
        setPhotos(data.objects || []);
        setLoading(false);
      }
    }

    if (uploadKey) load();
    return () => (cancelled = true);
  }, [uploadKey]);

  if (loading) {
    return (
      <InlineStack align="center">
        <Spinner size="small" />
      </InlineStack>
    );
  }

  if (photos.length === 0) {
    return <Text tone="subdued">No photos found.</Text>;
  }

  const downloadAll = () => {
    photos.forEach((p, i) => {
      const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `photo_${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <BlockStack gap="300">
      <Button variant="secondary" onClick={downloadAll}>
        Download all photos
      </Button>

      <InlineStack gap="300" wrap>
        {photos.map((p, i) => {
          const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;

          return (
            <Card key={p} padding="200">
              <BlockStack gap="200">
                <img
                  src={url}
                  style={{
                    width: 150,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
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
    <Page title="Orders">
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text variant="headingMd">Orders</Text>

          <Button
            variant="secondary"
            onClick={() => setShowHidden(v => !v)}
          >
            {showHidden ? "Hide hidden orders" : "Show hidden orders"}
          </Button>
        </InlineStack>

        {visibleOrders.length === 0 && (
          <Text tone="subdued">No orders found.</Text>
        )}

        {visibleOrders.map(order => (
          <Card key={order.id} padding="400">
            <BlockStack gap="300">
              {/* HEADER */}
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text variant="headingSm">{order.orderName}</Text>
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

                {/* ACTIONS */}
                <InlineStack gap="200">
                  <Button
                    onClick={() =>
                      setOpenPhotos(p => ({
                        ...p,
                        [order.id]: !p[order.id]
                      }))
                    }
                  >
                    {openPhotos[order.id] ? "Hide photos" : "View photos"}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      setOpenLogs(l => ({
                        ...l,
                        [order.id]: !l[order.id]
                      }))
                    }
                  >
                    Logs
                  </Button>

                  <Button
                    tone="critical"
                    variant="secondary"
                    onClick={() => {
                      console.log("HIDE ORDER", order.id);
                    }}
                  >
                    Hide
                  </Button>
                </InlineStack>
              </InlineStack>

              {/* PHOTOS */}
              {openPhotos[order.id] && order.uploadKey && (
                <>
                  <Divider />
                  <PhotoGallery uploadKey={order.uploadKey} />
                </>
              )}

              {/* LOGS */}
              {openLogs[order.id] && (
                <>
                  <Divider />
                  <BlockStack gap="100">
                    {order.logs.map(log => (
                      <Text key={log.id} tone="subdued">
                        <strong>{log.type}</strong> ·{" "}
                        {new Date(log.createdAt).toLocaleString()}
                        {log.message && ` — ${log.message}`}
                      </Text>
                    ))}
                  </BlockStack>
                </>
              )}
            </BlockStack>
          </Card>
        ))}
      </BlockStack>
    </Page>
  );
}
