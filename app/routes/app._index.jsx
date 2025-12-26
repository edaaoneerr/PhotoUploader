import { useLoaderData } from "react-router";
import { useEffect, useState } from "react";
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader() {
  const orders = await getMagnetOrders();
  return { orders };
}

const WORKER = "https://magnet-upload.kendinehasyazilimci.workers.dev";
const actionBtn = (bg) => ({
  padding: "6px 12px",
  background: bg,
  color: "white",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  userSelect: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
});

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

    setLoading(true);

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
    <div style={{ marginTop: 16 }}>
      <div
        style={actionBtn("#5C6AC4")}
        onClick={downloadAll}
      >
        Download All
      </div>

      <div
        style={{
          marginTop: 12,
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
                  marginBottom: 6,
                  cursor: "pointer"
                }}
                onClick={() => window.open(url, "_blank")}
              />

              <div
                style={{ ...actionBtn("#008060"), width: "100%" }}
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
              </div>
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
    <div style={{ padding: 24 }}>
      {/* TOP BAR */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h2 style={{ margin: 0 }}>Orders</h2>

        <div
          style={actionBtn("#6D7175")}
          onClick={() => setShowHidden(v => !v)}
        >
          {showHidden ? "Hide hidden orders" : "Show hidden orders"}
        </div>
      </div>

      {visibleOrders.length === 0 && (
        <div>No orders found.</div>
      )}

      {visibleOrders.map(order => (
        <div
          key={order.id}
          style={{
            border: "1px solid #e1e3e5",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16
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
              <div
                style={actionBtn("#008060")}
                onClick={() =>
                  toggle(openPhotos, setOpenPhotos, order.id)
                }
              >
                View Photos
              </div>

              <div
                style={actionBtn("#5C6AC4")}
                onClick={() =>
                  toggle(openLogs, setOpenLogs, order.id)
                }
              >
                See Logs
              </div>

              <div
                style={actionBtn("#6D7175")}
                onClick={() => {
                  console.log("HIDE ORDER", order.id);
                }}
              >
                Hide
              </div>
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
                  <strong>{log.type}</strong>{" "}
                  · {new Date(log.createdAt).toLocaleString()}
                  {log.message && ` — ${log.message}`}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
