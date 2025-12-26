import { json, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

// ✅ SERVER ONLY IMPORT
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader() {
  const orders = await getMagnetOrders();
  console.log("SERVER ORDERS:", orders);
  return json({ orders });
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
    <span style={{
      background: map[status] || "#999",
      color: "white",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600
    }}>
      {status}
    </span>
  );
}

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

  if (loading) return <div>Loading photos…</div>;
  if (!photos.length) return <div>No photos found.</div>;

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={actionBtn("#5C6AC4")}
        onClick={() => {
          console.log("DOWNLOAD ALL CLICKED");
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
        Download All
      </div>

      <div style={{
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12
      }}>
        {photos.map((p, i) => {
          const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;

          return (
            <div key={p} style={{ border: "1px solid #ddd", padding: 8 }}>
              <img
                src={url}
                style={{ width: "100%", cursor: "pointer" }}
                onClick={() => window.open(url, "_blank")}
              />
              <div
                style={{ ...actionBtn("#008060"), marginTop: 6 }}
                onClick={() => {
                  console.log("DOWNLOAD SINGLE", p);
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

export default function AppIndex() {
  const { orders } = useLoaderData();

  useEffect(() => {
    console.log("CLIENT HYDRATED");
  }, []);

  const [openPhotos, setOpenPhotos] = useState({});

  return (
    <div style={{ padding: 24 }}>
      <h2>Orders</h2>

      {orders.map(order => (
        <div key={order.id} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{order.orderName}</strong>
              <div>{order.email}</div>
              <StatusBadge status={order.status} />{" "}
              {order.photosCount} photos
            </div>

            <div
              style={actionBtn("#008060")}
              onClick={() => {
                console.log("VIEW PHOTOS CLICKED", order.id);
                setOpenPhotos(p => ({ ...p, [order.id]: !p[order.id] }));
              }}
            >
              View Photos
            </div>
          </div>

          {openPhotos[order.id] && (
            <PhotoGallery uploadKey={order.uploadKey} />
          )}
        </div>
      ))}
    </div>
  );
}
