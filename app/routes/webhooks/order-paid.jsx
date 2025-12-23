export async function action({ request }) {
  try {
    const order = await request.json();

    let magnetKey = null;

    for (const item of order.line_items || []) {
      const prop = item.properties?.find(
        (p) => p.name === "magnet_upload_key"
      );
      if (prop?.value) {
        magnetKey = prop.value;
        break;
      }
    }

    if (!magnetKey) {
      return new Response(
        JSON.stringify({ skipped: true }),
        { status: 200 }
      );
    }

    // ŞİMDİLİK SADECE LOG
    console.log("ORDER PAID | magnetKey:", magnetKey);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("error", { status: 500 });
  }
}
