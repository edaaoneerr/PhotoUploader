export async function action({ request }) {
  try {
    const payload = await request.json();
    console.log("ORDER PAID", payload.id);
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
}
