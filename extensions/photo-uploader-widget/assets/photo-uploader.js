(function () {
  if (!document.querySelector('[data-photo-uploader]')) {
    return;
  }

  if (window.__PHOTO_UPLOADER_INITIALIZED__) {
    return;
  }
  window.__PHOTO_UPLOADER_INITIALIZED__ = true;

  console.log('Photo uploader initialized ONCE on product page');
  const MAX_PHOTOS = 9;

  let currentWidget = null;
  let PRODUCT_VARIANT_ID = null;

  document.addEventListener('click', (e) => {
    const openButton = e.target.closest('[data-photo-uploader-open]');
    if (!openButton) return;

    currentWidget = openButton.closest('[data-photo-uploader]');
    if (!currentWidget) return;

    PRODUCT_VARIANT_ID = currentWidget.dataset.variantId;
    if (!PRODUCT_VARIANT_ID) {
      console.error('Variant ID yok');
      return;
    }

    openUploader();
  });

    const TEMPLATE_HTML  =  `
    <!-- UPLOADER MODAL -->
    <div class="photo-uploader-modal" data-photo-uploader-modal>
    <div class="photo-uploader-modal__inner">
        <button type="button" class="photo-uploader-modal__close" aria-label="Close">
        ×
        </button>

        <aside class="photo-uploader-sidebar">
        <div class="photo-uploader-sidebar__title">Sources</div>
        <ul class="photo-uploader-source-list">
            <li class="photo-uploader-source-item is-active">Local files</li>
            <li class="photo-uploader-source-item">Google Photos (soon)</li>
            <li class="photo-uploader-source-item">Dropbox (soon)</li>
        </ul>
        </aside>

        <main class="photo-uploader-main">
        <div class="photo-uploader-dropzone" data-dropzone>
            <p class="photo-uploader-dropzone__title">drag &amp; drop</p>
            <p class="photo-uploader-dropzone__subtitle">any files</p>
            <p class="photo-uploader-dropzone__or">or</p>
            <button type="button" class="photo-uploader-dropzone__button">
            upload from camera roll or pc
            </button>
            <input
            type="file"
            class="photo-uploader-input"
            accept="image/*"
            multiple
            hidden
            >
        </div>
        </main>

        <section class="photo-uploader-preview">
        <div class="photo-uploader-preview__title">Selection preview</div>
        <div class="photo-uploader-grid" data-photo-grid></div>

        <div class="photo-uploader-footer">
            <div class="photo-uploader-footer__top">
            <span class="photo-uploader-footer__count" data-selected-count>
                Selected 0 files of 9
            </span>
            <button type="button" class="photo-uploader-footer__cta">
                ADD TO CART
            </button>
            </div>

            <button
            type="button"
            class="photo-uploader-footer__preview-btn"
            data-preview-button
            disabled
            title="You must select 9 photos to continue"
            >
            PREVIEW SELECTION
            </button>

            <p class="photo-uploader-limit-note" data-limit-note></p>
        </div>
        </section>
    </div>
    </div>

    <!-- PREVIEW SELECTION MODAL -->
    <div class="photo-preview-modal" data-photo-preview-modal>
    <button type="button" class="photo-preview-modal__close" aria-label="Close preview">
        ×
    </button>
    <div class="photo-preview-modal__inner">
    <!-- MOBİLDE ÜSTTE GÖRÜNECEK BİLGİ BLOĞU -->
    <div class="photo-preview-mobile-info">
        <div class="photo-preview-title">Product preview</div>
        <div class="photo-preview-sub">Click pictures to resize or crop</div>

        <div class="photo-preview-legend">
        <div class="photo-preview-legend-row">
            <div class="photo-preview-legend-swatch"></div>
            <div>
            <strong style="font-size: 12px;">9 images have been cropped</strong><br>
            <span style="font-size: 11px;">
                9 images have been cropped to fit them into square magnets.<br>
                Please review before placing your order.
            </span>
            </div>
        </div>

        <div class="photo-preview-legend-row">
            <div style="width: 38px; height: 38px; border-radius: 4px; border: 2px dotted #f74551;"></div>
            <div>
            <strong style="font-size: 12px;">Magnet wrap area</strong><br>
            <span style="font-size: 11px;">
                Area beyond the dotted lines will wrap around the edges of your magnets
                (approx. 40×40&nbsp;mm magnets).
            </span>
            </div>
        </div>
        </div>
    </div>

    <!-- FOTOĞRAF LİSTESİ -->
    <div class="photo-preview-grid-wrap">
        <div class="photo-preview-grid" data-preview-grid></div>
    </div>

    <!-- DESKTOP İÇİN SAĞ PANEL (MOBİLDE SADECE BUTON KALACAK) -->
    <aside class="photo-preview-sidebar">
        <div>
        <div class="photo-preview-title">Product preview</div>
        <div class="photo-preview-sub">Click pictures to resize or crop</div>
        </div>

        <div class="photo-preview-legend">
        <div class="photo-preview-legend-row">
            <div class="photo-preview-legend-swatch"></div>
            <div>
            <strong style="font-size: 12px;">9 images have been cropped</strong><br>
            <span style="font-size: 11px;">
                9 images have been cropped to fit them into square magnets.<br>
                Please review before placing your order.
            </span>
            </div>
        </div>

        <div class="photo-preview-legend-row">
            <div style="width: 38px; height: 38px; border-radius: 4px; border: 2px dotted #f74551;"></div>
            <div>
            <strong style="font-size: 12px;">Magnet wrap area</strong><br>
            <span style="font-size: 11px;">
                Area beyond the dotted lines will wrap around the edges of your magnets
                (approx. 40×40&nbsp;mm magnets).
            </span>
            </div>
        </div>
        </div>

        <div class="photo-preview-selected-count" data-preview-selected-count>
        Selected 9/9
        </div>

        <button type="button" class="photo-preview-add-btn" data-add-to-cart>
        ADD TO CART
        </button>
    </aside>
    </div>
    </div>

    <!-- CROP MODAL -->
    <div class="photo-cropper" data-photo-cropper>
    <div class="photo-cropper__dialog">
        <div class="photo-cropper__title">Crop and add this image</div>
        <div class="photo-cropper__frame" data-crop-frame>
        <img class="photo-cropper__image" data-crop-image src="" alt="Crop preview" width="800" height="800">
        <div class="photo-cropper__overlay">
            <div class="photo-cropper__crop" data-crop-rect>
            <div class="photo-cropper__handle photo-cropper__handle--tl" data-handle="tl"></div>
            <div class="photo-cropper__handle photo-cropper__handle--tr" data-handle="tr"></div>
            <div class="photo-cropper__handle photo-cropper__handle--bl" data-handle="bl"></div>
            <div class="photo-cropper__handle photo-cropper__handle--br" data-handle="br"></div>
            </div>
        </div>
        </div>
        <div class="photo-cropper__hint">
        Move the square or drag its corners to choose a 1:1 crop.
        </div>
        <div class="photo-cropper__buttons">
        <button type="button" class="photo-cropper-btn photo-cropper-btn--secondary" data-crop-cancel>
            Cancel
        </button>
        <button type="button" class="photo-cropper-btn photo-cropper-btn--primary" data-crop-save>
            Save
        </button>
        </div>
    </div>`;

  if (!document.querySelector('[data-photo-uploader-modal]')) {
        document.body.insertAdjacentHTML('beforeend', TEMPLATE_HTML);
        }


  const uploaderModal= document.querySelector('[data-photo-uploader-modal]');
  const previewModal = document.querySelector('[data-photo-preview-modal]');
  const closeUpload  = uploaderModal?.querySelector('.photo-uploader-modal__close');
  const closePreview = previewModal?.querySelector('.photo-preview-modal__close');

  const dropzone   = uploaderModal?.querySelector('[data-dropzone]');
  const fileInput  = uploaderModal?.querySelector('.photo-uploader-input');
  const grid       = uploaderModal?.querySelector('[data-photo-grid]');
  const countEl    = uploaderModal?.querySelector('[data-selected-count]');
  const limitNote  = uploaderModal?.querySelector('[data-limit-note]');
  const uploadBtn  = uploaderModal?.querySelector('.photo-uploader-dropzone__button');
  const previewBtn = uploaderModal?.querySelector('[data-preview-button]');

  const previewGrid   = previewModal?.querySelector('[data-preview-grid]');
  const previewCount  = previewModal?.querySelector('[data-preview-selected-count]');

  const cropper   = document.querySelector('[data-photo-cropper]');
  const cropImage = cropper?.querySelector('[data-crop-image]');
  const cropFrame = cropper?.querySelector('[data-crop-frame]');
  const cropRect  = cropper?.querySelector('[data-crop-rect]');
  const cropCancel= cropper?.querySelector('[data-crop-cancel]');
  const cropSave  = cropper?.querySelector('[data-crop-save]');


  let photos = [];
  let currentPhotoId = null;

  let naturalW = 0;
  let naturalH = 0;
  let draggingMode = null;
  let resizeHandle = null;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, startSize = 0;




  /* ---------- MODAL AÇ / KAPA ---------- */
  function openUploader() {
    uploaderModal.classList.add('is-open');
    previewModal.classList.remove('is-open');
    document.body.classList.add('photo-uploader-modal-open');
  }

  function openPreviewModal() {
    uploaderModal.classList.remove('is-open');
    previewModal.classList.add('is-open');
  }

  function closeAll() {
    uploaderModal.classList.remove('is-open');
    previewModal.classList.remove('is-open');
    document.body.classList.remove('photo-uploader-modal-open');
  }

  closeUpload.addEventListener('click', closeAll);
  closePreview.addEventListener('click', openUploader);

  uploaderModal.addEventListener('click', (e) => {
    if (e.target === uploaderModal) closeAll();
  });
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) openUploader();
  });

  uploadBtn.addEventListener('click', () => fileInput.click());

  /* ---------- HELPER: COUNT + PREVIEW BUTTON ---------- */
  function updateCountAndButtons() {
    const total = photos.length;
    if (countEl) countEl.textContent = `Selected ${total} files of ${MAX_PHOTOS}`;
    if (previewCount) previewCount.textContent = `Selected ${total}/${MAX_PHOTOS}`;

    if (!previewBtn) return;
    if (total === MAX_PHOTOS) {
      previewBtn.disabled = false;
      previewBtn.classList.add('is-active');
      previewBtn.title = 'Preview your selection';
    } else {
      previewBtn.disabled = true;
      previewBtn.classList.remove('is-active');
      previewBtn.title = 'You must select 9 photos to continue';
    }
  }

  /* ---------- HELPER: RENDER GRIDS ---------- */
  function renderUploaderGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    photos.forEach((p, index) => {
      const item = document.createElement('div');
      item.className = 'photo-uploader-item';
      item.dataset.photoId = p.id;
      const thumbSrc = p.croppedSrc || p.originalSrc;
      item.innerHTML = `
        <img src="${thumbSrc}" alt="Photo ${index + 1}">
        <div class="photo-uploader-actions">
          <button type="button" class="photo-uploader-icon-btn" data-edit aria-label="Edit photo">
            <svg width="13" height="13" viewBox="0 0 16 16" class="photo-uploader-icon" aria-hidden="true">
              <path d="M2 11.5L10.8 2.7c.4-.4 1-.4 1.4 0l1.1 1.1c.4.4.4 1 0 1.4L4.5 14H2v-2.5zM11.2 2l2.8 2.8" />
            </svg>
          </button>
          <button type="button" class="photo-uploader-icon-btn" data-delete aria-label="Delete photo">
            <svg width="13" height="13" viewBox="0 0 16 16" class="photo-uploader-icon" aria-hidden="true">
              <path d="M5 2h6l-.5 1H13v1H3V3h2.5L5 2zm1 4h1v6H6V6zm3 0h1v6H9V6zM4 5h8v7.5A1.5 1.5 0 0 1 10.5 14h-5A1.5 1.5 0 0 1 4 12.5V5z" />
            </svg>
          </button>
        </div>
      `;
      grid.appendChild(item);
    });
  }

    function renderPreviewGrid() {
      if (!previewGrid) return;
      previewGrid.innerHTML = '';

      const total = photos.length;

      photos.forEach((p, index) => {
        const block = document.createElement('div');
        block.className = 'photo-preview-block';
        block.dataset.photoId = p.id;
        const thumbSrc = p.croppedSrc || p.originalSrc;

        block.innerHTML = `
          <div class="photo-preview-block-header">
            <span class="photo-preview-index">${index + 1}/${total}</span>
            <span class="photo-preview-status">Cropped</span>
          </div>

          <div class="photo-preview-item">
            <img src="${thumbSrc}" alt="Preview ${index + 1}">
            <div class="photo-preview-actions">
              <button type="button" class="photo-preview-icon-btn" data-preview-edit aria-label="Edit photo">
                <svg width="13" height="13" viewBox="0 0 16 16" class="photo-preview-icon" aria-hidden="true">
                  <path d="M2 11.5L10.8 2.7c.4-.4 1-.4 1.4 0l1.1 1.1c.4.4.4 1 0 1.4L4.5 14H2v-2.5zM11.2 2l2.8 2.8" />
                </svg>
              </button>
              <button type="button" class="photo-preview-icon-btn" data-preview-delete aria-label="Delete photo">
                <svg width="13" height="13" viewBox="0 0 16 16" class="photo-preview-icon" aria-hidden="true">
                  <path d="M5 2h6l-.5 1H13v1H3V3h2.5L5 2zm1 4h1v6H6V6zm3 0h1v6H9V6zM4 5h8v7.5A1.5 1.5 0 0 1 10.5 14h-5A1.5 1.5 0 0 1 4 12.5V5z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="photo-preview-block-footer">
            <button type="button" class="photo-preview-text-btn" data-preview-edit>Edit</button>
            <button type="button" class="photo-preview-text-btn" data-preview-delete>Delete</button>
          </div>
        `;

        previewGrid.appendChild(block);
      });
    }



  function rerenderAll() {
    renderUploaderGrid();
    renderPreviewGrid();
    updateCountAndButtons();
  }

    function generateUploadKey() {
    if (window.crypto?.randomUUID) {
      return "magnet-" + crypto.randomUUID();
    }
    return "magnet-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }


  /* ---------- DOSYA EKLEME (MAX 9) ---------- */
  function addFiles(fileList) {
    if (limitNote) limitNote.textContent = '';
    const availableSlots = MAX_PHOTOS - photos.length;
    if (availableSlots <= 0) {
      if (limitNote) limitNote.textContent = `You can only select ${MAX_PHOTOS} photos. Extra files were ignored.`;
      return;
    }

    const files = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, availableSlots);

    if (fileList.length > files.length && limitNote) {
      limitNote.textContent = `Only ${MAX_PHOTOS} photos are allowed. Extra files were ignored.`;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const baseSrc = event.target.result;

        const img = new Image();
        img.onload = () => {
          const canvasSize = 800;
          const canvas = document.createElement('canvas');
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          const ctx = canvas.getContext('2d');

          const scale = Math.max(canvasSize / img.width, canvasSize / img.height);
          const drawW = img.width  * scale;
          const drawH = img.height * scale;
          const dx = (canvasSize - drawW) / 2;
          const dy = (canvasSize - drawH) / 2;

          ctx.drawImage(img, dx, dy, drawW, drawH);

          const squareDataUrl = canvas.toDataURL('image/jpeg', 0.9);

          const id = String(Date.now()) + Math.random().toString(16).slice(2);
          photos.push({
            id,
            originalSrc: baseSrc,
            croppedSrc: squareDataUrl,
            cropState: null
          });

          rerenderAll();
        };

        img.src = baseSrc;
      };
      reader.readAsDataURL(file);
    });
  }

  fileInput.addEventListener('change', () => {
    if (!fileInput.files || !fileInput.files.length) return;
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length) {
      addFiles(files);
    }
  });

  /* ---------- CROP HELPER ---------- */
  function openCropper(photo) {
    if (!cropper || !cropImage || !cropRect || !cropFrame) return;

    currentPhotoId = photo.id;

    cropImage.onload = () => {
      naturalW = cropImage.naturalWidth || 1;
      naturalH = cropImage.naturalHeight || 1;

      const imgRect = cropImage.getBoundingClientRect();
      const frameRect = cropFrame.getBoundingClientRect();

      let size, left, top;

      if (photo.cropState) {
        size = imgRect.width * photo.cropState.sizeNorm;
        left = imgRect.left + imgRect.width * photo.cropState.xNorm;
        top  = imgRect.top  + imgRect.height * photo.cropState.yNorm;
      } else {
        const visibleSize = Math.min(imgRect.width, imgRect.height) * 0.7;
        size = visibleSize;
        left = (imgRect.left + imgRect.right) / 2 - visibleSize / 2;
        top  = (imgRect.top + imgRect.bottom) / 2 - visibleSize / 2;
      }

      cropRect.style.width  = size + 'px';
      cropRect.style.height = size + 'px';
      cropRect.style.left   = (left - frameRect.left) + 'px';
      cropRect.style.top    = (top  - frameRect.top)  + 'px';
    };

    cropImage.src = photo.originalSrc;
    cropper.classList.add('is-open');
  }

  function closeCropper() {
    cropper.classList.remove('is-open');
    currentPhotoId = null;
    draggingMode = null;
  }

  cropCancel.addEventListener('click', closeCropper);

  cropRect.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const handle = e.target.closest('[data-handle]');
    const frameRect = cropFrame.getBoundingClientRect();
    const rect = cropRect.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left - frameRect.left;
    startTop  = rect.top  - frameRect.top;
    startSize = rect.width;

    if (handle) {
      draggingMode = 'resize';
      resizeHandle = handle.getAttribute('data-handle');
    } else {
      draggingMode = 'move';
      resizeHandle = null;
    }

    window.addEventListener('mousemove', onCropMove);
    window.addEventListener('mouseup', onCropUp);
  });

  function onCropMove(e) {
    if (!draggingMode) return;

    const frameRect = cropFrame.getBoundingClientRect();
    const imgRect   = cropImage.getBoundingClientRect();

    if (draggingMode === 'move') {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = startLeft + dx;
      let newTop  = startTop  + dy;
      const size  = startSize;

      const minLeft = imgRect.left - frameRect.left;
      const minTop  = imgRect.top  - frameRect.top;
      const maxLeft = imgRect.right - frameRect.left - size;
      const maxTop  = imgRect.bottom - frameRect.top  - size;

      newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
      newTop  = Math.max(minTop,  Math.min(maxTop,  newTop));

      cropRect.style.left = newLeft + 'px';
      cropRect.style.top  = newTop  + 'px';
    }

    if (draggingMode === 'resize') {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (resizeHandle === 'tl' || resizeHandle === 'bl') {
        delta = -delta;
      }
      let newSize = startSize + delta;
      newSize = Math.max(40, newSize);

      let newLeft = startLeft;
      let newTop  = startTop;
      if (resizeHandle === 'tl') {
        newLeft = startLeft + (startSize - newSize);
        newTop  = startTop  + (startSize - newSize);
      } else if (resizeHandle === 'tr') {
        newTop  = startTop  + (startSize - newSize);
      } else if (resizeHandle === 'bl') {
        newLeft = startLeft + (startSize - newSize);
      }

      const minLeft = imgRect.left - frameRect.left;
      const minTop  = imgRect.top  - frameRect.top;
      const maxLeft = imgRect.right - frameRect.left - newSize;
      const maxTop  = imgRect.bottom - frameRect.top  - newSize;

      newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
      newTop  = Math.max(minTop,  Math.min(maxTop,  newTop));

      const maxSizeByRight  = imgRect.right  - frameRect.left - newLeft;
      const maxSizeByBottom = imgRect.bottom - frameRect.top  - newTop;
      newSize = Math.min(newSize, maxSizeByRight, maxSizeByBottom);

      cropRect.style.width  = newSize + 'px';
      cropRect.style.height = newSize + 'px';
      cropRect.style.left   = newLeft + 'px';
      cropRect.style.top    = newTop  + 'px';
    }
  }

  function onCropUp() {
    draggingMode = null;
    resizeHandle = null;
    window.removeEventListener('mousemove', onCropMove);
    window.removeEventListener('mouseup', onCropUp);
  }

  cropSave.addEventListener('click', () => {
    if (!currentPhotoId || !cropImage || !cropRect) return;

    const photo = photos.find(p => p.id === currentPhotoId);
    if (!photo) return;

    const imgRect = cropImage.getBoundingClientRect();
    const rect    = cropRect.getBoundingClientRect();

    const scaleX = naturalW / imgRect.width;
    const scaleY = naturalH / imgRect.height;

    const cropLeftInImg = rect.left - imgRect.left;
    const cropTopInImg  = rect.top  - imgRect.top;
    const cropSizeInImg = rect.width;

    const sx    = cropLeftInImg * scaleX;
    const sy    = cropTopInImg  * scaleY;
    const sSize = cropSizeInImg * scaleX;

    photo.cropState = {
      xNorm: cropLeftInImg / imgRect.width,
      yNorm: cropTopInImg  / imgRect.height,
      sizeNorm: rect.width / imgRect.width
    };

    const canvasSize = 800;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      cropImage,
      sx, sy, sSize, sSize,
      0, 0, canvasSize, canvasSize
    );

    photo.croppedSrc = canvas.toDataURL('image/jpeg', 0.9);

    closeCropper();
    rerenderAll();
  });

  /* ---------- GRID CLICKLERİ ---------- */
  grid.addEventListener('click', (event) => {
    const item = event.target.closest('.photo-uploader-item');
    if (!item) return;
    const id = item.dataset.photoId;
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    if (event.target.closest('[data-delete]')) {
      photos = photos.filter(p => p.id !== id);
      rerenderAll();
      return;
    }

    if (event.target.closest('[data-edit]')) {
      openCropper(photo);
      return;
    }
  });

    previewGrid.addEventListener('click', (event) => {
    const block = event.target.closest('.photo-preview-block');
    if (!block) return;

    const id = block.dataset.photoId;
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    // Delete (hem ikon hem text buton için)
    if (event.target.closest('[data-preview-delete]')) {
      photos = photos.filter(p => p.id !== id);
      rerenderAll();
      openUploader();
      return;
    }

    // Edit: ikona, text butona ya da resmin kendisine tıklayınca crop aç
    if (
      event.target.closest('[data-preview-edit]') ||
      event.target.closest('.photo-preview-item')
    ) {
      openCropper(photo);
      return;
    }
  });


  /* ---------- PREVIEW BUTTON ---------- */
  previewBtn.addEventListener('click', () => {
    if (previewBtn.disabled) return;
    openPreviewModal();
  });

  /* ---------- ADD TO CART (3×3 COMPOSITE) ---------- */
  async function buildCompositePreview() {
    const canvasSize = 900;
    const gridCount  = 3;
    const cellSize   = canvasSize / gridCount;
    const innerGap   = 6;

    const canvas = document.createElement('canvas');
    canvas.width  = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let i = 0; i < MAX_PHOTOS; i++) {
      const p = photos[i];
      if (!p) continue;

      const src = p.croppedSrc || p.originalSrc;
      const img = new Image();
      img.src = src;
      await new Promise(res => { img.onload = res; img.onerror = res; });

      const col = i % gridCount;
      const row = Math.floor(i / gridCount);

      const cellX = col * cellSize;
      const cellY = row * cellSize;

      const targetSize = cellSize - innerGap * 2;
      const targetX    = cellX + innerGap;
      const targetY    = cellY + innerGap;

      const scale = Math.max(targetSize / img.width, targetSize / img.height);
      const drawW = img.width  * scale;
      const drawH = img.height * scale;
      const dx    = targetX + (targetSize - drawW) / 2;
      const dy    = targetY + (targetSize - drawH) / 2;

      ctx.drawImage(img, dx, dy, drawW, drawH);
    }

    return canvas.toDataURL('image/jpeg', 0.75);
  }

    // IndexedDB'ye fotoğrafları kaydet (cart sayfasında göstermek için)
  async function savePhotosToIndexedDB(uploadKey, photosArray) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('magnetPhotosDB', 1);
      
      request.onerror = () => {
        console.error('❌ IndexedDB açılamadı');
        reject(request.error);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['photos'], 'readwrite');
        const store = transaction.objectStore('photos');
        
        const photosData = photosArray.map(p => ({
          id: p.id,
          croppedSrc: p.croppedSrc || p.originalSrc
        }));
        
        const data = {
          key: uploadKey,
          photos: photosData,
          timestamp: Date.now()
        };
        
        const putRequest = store.put(data);
        putRequest.onsuccess = () => {
          console.log('✅ Fotoğraflar IndexedDB\'ye kaydedildi:', uploadKey);
          resolve(true);
        };
        putRequest.onerror = () => {
          console.error('❌ IndexedDB kayıt hatası');
          reject(putRequest.error);
        };
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          const objectStore = db.createObjectStore('photos', { keyPath: 'key' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  function replaceProductImageWithComposite(dataUrl) {
  const selectors = [
    '.product__media img',
    '.product-media img',
    '.product__main-image img',
    '.product-gallery img',
    '[data-media-id] img',
    '.product__image img'
  ];

  let img = null;

  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) {
      img = el;
      break;
    }
  }

  if (!img) {
    console.warn('❌ Product image not found');
    return;
  }

  // Shopify theme override etmesin diye temizle
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  img.removeAttribute('data-src');
  img.removeAttribute('data-srcset');
  img.removeAttribute('loading');

  img.src = dataUrl;

  // Theme geri değiştirmeye çalışırsa tekrar bas
  const observer = new MutationObserver(() => {
    if (img.src !== dataUrl) {
      img.src = dataUrl;
    }
  });

  observer.observe(img, {
    attributes: true,
    attributeFilter: ['src', 'srcset']
  });

  console.log('✅ Product image replaced with 3×3 composite');
}



function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.src = url;
  });
}

if (!window.__PHOTO_UPLOADER_ADD_HANDLER__) {
  window.__PHOTO_UPLOADER_ADD_HANDLER__ = true;
  /* ---- ADD TO CART: DELEGATED CLICK HANDLER ---- */
    document.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-add-to-cart]');
    if (!btn) return;

    if (photos.length !== MAX_PHOTOS) {
      alert(`Lütfen tam ${MAX_PHOTOS} fotoğraf seç.`);
      return;
    }

    if (!PRODUCT_VARIANT_ID) {
      console.error('PRODUCT_VARIANT_ID boş veya tanımsız:', PRODUCT_VARIANT_ID);
      alert('Ürün varyantı bulunamadı. Bu bölümü sadece ürün sayfasında kullan.');
      return;
    }

    try {
      // 1) Bu sipariş için benzersiz bir anahtar üret
      const uploadKey = generateUploadKey();

      // 2) Fotoğrafları IndexedDB'ye kaydet (cart sayfasında göstermek için)
      // Cloudflare'a sadece sipariş verildiğinde yüklenecek
      await savePhotosToIndexedDB(uploadKey, photos);

      // 1) FOTOĞRAFLARI CLOUDFLARE'A UPLOAD ET
      await fetch('/api/upload-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: uploadKey,
          photos: photos.map(p => p.croppedSrc)
        })
      });

      // 3. Composite üret
      const compositeImage = await buildCompositePreview();

            // 5. Ürün preview fotoğrafını değiştir (Shopify product page)
      replaceProductImageWithComposite(compositeImage);

      // 4. Global değişkene ata
      window.compositeImage = compositeImage;




      // 3) Shopify'a sadece küçük bir ID gönder
      // Cart API properties'i object formatında bekler, siparişe geçtiğinde array'e dönüşür
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: PRODUCT_VARIANT_ID,
          quantity: 1,
          properties: {
            "magnet_upload_key": uploadKey
           }
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Response JSON parse edilemedi', e);
      }

      if (!response.ok) {
        console.error('Add to cart error', response.status, data);
        alert('Ürün sepete eklenemedi. (Hata kodu: ' + response.status + ')');
        return;
      }

      window.location.href = '/cart';
    } catch (err) {
      console.error('Add to cart network error', err);
      alert('Bir hata oluştu, lütfen tekrar deneyin.');
    }
  });}
})();