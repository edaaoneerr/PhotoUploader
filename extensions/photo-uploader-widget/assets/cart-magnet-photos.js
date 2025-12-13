(async function () {
  if (!location.pathname.includes('/cart')) return;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('magnetPhotosDB', 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  const db = await openDB();

  async function renderGrid(el) {
    if (el.dataset.loaded === '1') return;

    const uploadKey = el.dataset.uploadKey;
    if (!uploadKey) return;

    const tx = db.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const req = store.get(uploadKey);

    req.onsuccess = () => {
      const data = req.result;
      if (!data || !data.photos) return;

      el.innerHTML = data.photos
        .slice(0, 9)
        .map(p => `
          <div class="magnet-cart-grid__cell">
            <img src="${p.croppedSrc}" />
          </div>
        `)
        .join('');

      el.dataset.loaded = '1';
    };
  }

  function renderAll() {
    document
      .querySelectorAll('[data-magnet-cart-grid]')
      .forEach(renderGrid);
  }

  renderAll();

  new MutationObserver(renderAll)
    .observe(document.body, { childList: true, subtree: true });
})();
