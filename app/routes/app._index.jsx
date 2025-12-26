import { useLoaderData } from "react-router";
import { Page, Card, Text } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader() {
  const orders = await getMagnetOrders();
  return { orders };
}


const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";
const actionBtn = (bg) => ({
  padding: "6px 10px",
  background: bg,
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600
});


/* -------------------- */
/* STATUS BADGE */
/* -------------------- */
function StatusBadge({ status }) {
  const map = {
    completed: "#008060",
    retrying: "#E0A800",
    failed: "#D82C0D",
    refunded: "#6D7175",
    mailed: "#5C6AC4"
  };

  return (
    <span
      style={{
        background: map[status] || "#999",
        color: "white",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600
      }}
    >
      {status}
    </span>
  );
}

/* -------------------- */
/* PHOTO GALLERY */
/* -------------------- */
function PhotoGallery({ uploadKey }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uploadKey) return;

    fetch(`${WORKER}/list?key=${encodeURIComponent(uploadKey)}`)
      .then(r => r.json())
      .then(d => setPhotos(d.objects || []))
      .finally(() => setLoading(false));
  }, [uploadKey]);

  if (loading) {
    return <div style={{ marginTop: 12 }}>Loading photos…</div>;
  }

  if (photos.length === 0) {
    return <div style={{ marginTop: 12 }}>No photos found.</div>;
  }

  const downloadAll = async () => {
    for (const p of photos) {
      const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = p.split("/").pop();
      a.click();
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={downloadAll}
        style={{
          marginBottom: 12,
          padding: "6px 12px",
          background: "#5C6AC4",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer"
        }}
      >
        Download All
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12
        }}
      >
        {photos.map((p, i) => {
          const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;

          return (
            <div
              key={p}
              style={{
                border: "1px solid #e1e3e5",
                borderRadius: 8,
                padding: 8
              }}
            >
              <img
                src={url}
                style={{
                  width: "100%",
                  borderRadius: 6,
                  marginBottom: 6
                }}
              />

              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `photo_${i + 1}.jpg`;
                  a.click();
                }}
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#008060",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Download
              </button>
            </div>
          );
        })}
      </div>
    </div>
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

  const toggle = (map, setMap, id) =>
    setMap(prev => ({ ...prev, [id]: !prev[id] }));

  const visibleOrders = orders.filter(o =>
    showHidden ? true : !o.hidden
  );

  return (
    <Page title="Orders">
      <Card>
        <div style={{ padding: 20 }}>
          {/* TOP TOGGLE */}
          <button
            onClick={() => setShowHidden(v => !v)}
            style={{
              marginBottom: 20,
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              cursor: "pointer"
            }}
          >
            {showHidden ? "Hide hidden orders" : "Show hidden orders"}
          </button>

          {visibleOrders.length === 0 && (
            <Text>No orders found.</Text>
          )}

          {visibleOrders.map(order => (
            <div
              key={order.id}
              style={{
                border: "1px solid #e1e3e5",
                borderRadius: 8,
                padding: 16,
                marginBottom: 14
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {order.orderName}
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {order.customerName || "No name"} · {order.email}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={order.status} />{" "}
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {order.photosCount} photos
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                  style={actionBtn("#008060")}
                    onClick={() =>
                      toggle(openPhotos, setOpenPhotos, order.id)
                    }
                  >
                    View Photos
                  </button>

                  <button
                  style={actionBtn("#5C6AC4")}
                    onClick={() =>
                      toggle(openLogs, setOpenLogs, order.id)
                    }
                  >
                    See Logs
                  </button>

                  <button style={actionBtn("#6D7175")}>
                    Hide
                  </button>
                </div>
              </div>

              {/* PHOTOS */}
              {openPhotos[order.id] && order.uploadKey && (
                <PhotoGallery uploadKey={order.uploadKey} />
              )}

              {/* LOGS */}
              {openLogs[order.id] && (
                <div
                  style={{
                    marginTop: 12,
                    background: "#fafbfb",
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 12
                  }}
                >
                  {order.logs.map(log => (
                    <div key={log.id}>
                      <strong>{log.type}</strong> ·{" "}
                      {new Date(log.createdAt).toLocaleString()}
                      {log.message && ` — ${log.message}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}
