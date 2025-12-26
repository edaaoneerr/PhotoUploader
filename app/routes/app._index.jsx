export default function Index() {
  return (
    <div
      onClick={() => console.log("CLICK ROOT")}
      style={{ padding: 40, cursor: "pointer" }}
    >
      ROOT CLICK TEST
    </div>
  );
}
