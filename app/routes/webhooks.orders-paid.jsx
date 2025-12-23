export async function action({ request }) {
    const photos = global.__PHOTO_STASH__?.[uploadKey];

    if (!photos) {
      console.error("❌ Photos not found for", uploadKey);
      return res.status(200).send("no photos");
    }

    console.log("🖼 Photos ready:", photos.length);

}
