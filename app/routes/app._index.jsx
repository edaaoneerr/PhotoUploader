import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  Text,
  Badge,
} from "@shopify/polaris";
import { getMagnetOrders } from "../services/magnet-orders.server";

// --------------------
// Loader: DB'den siparişleri alır
// --------------------
export async function loader() {
  const orders = await getMagnetOrders();
  return { orders };
}

export default function Index() {
  const { orders } = useLoaderData();

  const statusTone = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "retrying":
        return "attention";
      case "failed":
        return "critical";
      case "refunded":
        return "warning";
      case "mailed":
        return "info";
      default:
        return "new";
    }
  };

  return (
    <Page title="Orders">
      <Card>
        <div style={{ padding: 20 }}>

          {orders.length === 0 && (
            <Text>No orders found.</Text>
          )}

          {orders.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 10px",
              }}
            >
              <thead>
                <tr style={{ background: "#f6f6f7" }}>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Photos</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    style={{
                      background: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    <td style={tdStyleStrong}>{o.orderName}</td>
                    <td style={tdStyle}>{o.customerName || "—"}</td>
                    <td style={tdStyle}>{o.email}</td>
                    <td style={tdStyleCenter}>{o.photosCount}</td>
                    <td style={tdStyleCenter}>
                      <Badge tone={statusTone(o.status)}>
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </Card>
    </Page>
  );
}

const thStyle = {
  padding: "12px 15px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "14px",
  color: "#303030",
};

const tdStyle = {
  padding: "15px",
  fontSize: "14px",
  color: "#303030",
};

const tdStyleStrong = {
  ...tdStyle,
  fontWeight: 600,
  color: "#F74551",
};

const tdStyleCenter = {
  ...tdStyle,
  textAlign: "center",
};
