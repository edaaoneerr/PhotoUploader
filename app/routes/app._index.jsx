import { useLoaderData } from "react-router";
import { Page, Layout, Card, Button, Badge, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader() {
  const orders = await getMagnetOrders();
  return { orders };
}

const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";

function StatusBadge({ status }) {
  const map = {
    completed: "success",
    retrying: "attention",
    failed: "critical",
    refunded: "warning",
    mailed: "info"
  };

  return <Badge tone={map[status] || "neutral"}>{status}</Badge>;
}

function PhotoGallery({ uploadKey }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetch(`${WORKER}/list?key=${encodeURIComponent(uploadKey)}`)
      .then(r => r.json())
      .then(d => setPhotos(d.objects || []));
  }, [uploadKey]);

  if (photos.length === 0) {
    return <Text>No photos found</Text>;
  }

  return (
    <Layout>
      {photos.map((p, i) => {
        const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;
        return (
          <Layout.Section oneThird key={p}>
            <Card>
              <img
                src={url}
                style={{ width: "100%", borderRadius: 8 }}
                onClick={() => window.open(url, "_blank")}
              />
              <div style={{ marginTop: 8 }}>
                <Button
                  fullWidth
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `photo_${i + 1}.jpg`;
                    a.click();
                  }}
                >
                  Download
                </Button>
              </div>
            </Card>
          </Layout.Section>
        );
      })}
    </Layout>
  );
}

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
      <Layout>
        {visibleOrders.map(order => (
          <Layout.Section key={order.id}>
            <Card>
              <Layout>
                <Layout.Section>
                  <Text variant="headingMd">{order.orderName}</Text>
                  <Text tone="subdued">
                    {order.customerName || "No name"} · {order.email}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge status={order.status} />{" "}
                    <Text tone="subdued">{order.photosCount} photos</Text>
                  </div>
                </Layout.Section>

                <Layout.Section secondary>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      onClick={() =>
                        setOpenPhotos(p => ({
                          ...p,
                          [order.id]: !p[order.id]
                        }))
                      }
                    >
                      View Photos
                    </Button>

                    <Button
                      onClick={() =>
                        setOpenLogs(l => ({
                          ...l,
                          [order.id]: !l[order.id]
                        }))
                      }
                    >
                      See Logs
                    </Button>

                    <Button tone="critical">Hide</Button>
                  </div>
                </Layout.Section>
              </Layout>

              {openPhotos[order.id] && order.uploadKey && (
                <div style={{ marginTop: 16 }}>
                  <PhotoGallery uploadKey={order.uploadKey} />
                </div>
              )}

              {openLogs[order.id] && (
                <div style={{ marginTop: 16 }}>
                  {order.logs.map(log => (
                    <Text key={log.id}>
                      <strong>{log.type}</strong>{" "}
                      {new Date(log.createdAt).toLocaleString()}
                    </Text>
                  ))}
                </div>
              )}
            </Card>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  );
}
