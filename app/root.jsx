import { Outlet } from "react-router";
import { useEffect } from "react";

export default function Root() {
  useEffect(() => {
    console.log("🔥 ROOT CLIENT EFFECT");
  }, []);

  return (
    <div
      onClick={() => console.log("🔥 ROOT CLICK")}
      style={{ padding: 40, border: "3px solid red" }}
    >
      ROOT WRAPPER
      <Outlet />
    </div>
  );
}
