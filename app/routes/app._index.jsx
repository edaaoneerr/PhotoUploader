import { useLoaderData } from "react-router";
import { useEffect, useState } from "react";

// ✅ SERVER FUNCTION IMPORT
import { getMagnetOrders } from "../services/magnet-orders.server";

export async function loader() {
  const orders = await getMagnetOrders();
  console.log("SERVER ORDERS:", orders);
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

  useEffect(() => {
    if (!uploadKey) return;

    fetch(`${WORKER}/list?key=${encodeURIComponent(uploadKey)}`)
      .then(r => r.json())
      .then(d => {
        console.log("PHOTOS FETCHED", d.objects);
        setPhotos(d.objects || []);
      });
  }, [uploadKey]);

  if (!photos.length) return <div>No photos</div>;

  return (
    <div style={{ marginTop: 12 }}>
      {photos.map((p, i) => {
        const url = `${WORKER}/file?object=${encodeURIComponent(p)}`;
        return (
          <div key={p}>
            <img
              src={url}
              style={{ width: 120, cursor: "pointer" }}
              onClick={() => {
                console.log("IMAGE CLICK", p);
                window.open(url);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AppIndex() {
  const { orders } = useLoaderData();

  useEffect(() => {
    console.log("CLIENT HYDRATED");
  }, []);

  const [open, setOpen] = useState({});

  return (
    <div style={{ padding: 24 }}>
      <h2>Orders</h2>

      {orders.map(order => (
        <div key={order.id} style={{ border: "1px solid #ccc", padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{order.orderName}</strong>
              <div>{order.email}</div>
              <StatusBadge status={order.status} />
            </div>

            <div
              style={actionBtn("#008060")}
              onClick={() => {
                console.log("VIEW CLICK", order.id);
                setOpen(o => ({ ...o, [order.id]: !o[order.id] }));
              }}
            >
              View Photos
            </div>
          </div>

          {open[order.id] && (
            <PhotoGallery uploadKey={order.uploadKey} />
          )}
        </div>
      ))}
    </div>
  );
}
