const album = document.querySelector('#guest-album');
const endpoint = album?.dataset.endpoint;
if (endpoint && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
  startAlbum();
}

function startAlbum() {
  const form = album.querySelector('form');
  const input = document.getElementById('guest-album-photo');
  const submit = form.querySelector('button');
  const status = album.querySelector('[role=status]');
  const gallery = album.querySelector('[data-gallery]');
  const randomId = () => crypto.randomUUID().replaceAll('-', '');
  const guest = new URLSearchParams(location.search).get('to')?.trim();
  let remaining = 0;
  let draft;
  let busy = false;

  function readAlbum(params = {}) {
    return new Promise((resolve, reject) => {
      const callback = 'guestAlbum_' + randomId();
      const script = document.createElement('script');
      const url = new URL(endpoint);
      url.search = new URLSearchParams({...params, callback});
      const finish = (error, result) => {
        clearTimeout(timer);
        script.remove();
        delete window[callback];
        error ? reject(error) : resolve(result);
      };
      const timer = setTimeout(() => finish(new Error('Timeout')), 12000);
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('Network error'));
      script.src = url.href;
      document.head.append(script);
    });
  }

  const validGuest = guest && guest.length <= 160;
  const quota = validGuest ? readAlbum({id: randomId(), guest}).then(receipt => {
    if (!receipt.directUpload) return false;
    remaining = receipt.remaining;
    if (!busy) status.textContent = remaining ? 'Sisa kuota: ' + remaining + ' dari 10 foto.' : 'Kuota 10 foto sudah habis.';
    return true;
  }).catch(() => {
    if (!busy) status.textContent = 'Unggah foto belum tersedia. Coba muat ulang halaman.';
    return false;
  }) : Promise.resolve(false);

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file || busy || !validGuest) return;
    busy = input.disabled = true;
    submit.hidden = true;
    draft = null;
    status.textContent = 'Menyiapkan foto…';
    try {
      if (!await quota) {
        status.textContent = 'Unggah foto belum tersedia. Coba muat ulang halaman.';
        return;
      }
      if (remaining <= 0) {
        status.textContent = 'Kuota 10 foto sudah habis.';
        return;
      }
      const photo = await preparePhoto(file);
      draft = {id: randomId(), photo, guest};
      await uploadDraft();
    } catch {
      status.textContent = 'Foto belum bisa dibaca. Coba pilih ulang.';
    } finally {
      input.value = '';
      busy = input.disabled = false;
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!draft || busy || remaining <= 0) return;
    busy = input.disabled = true;
    try {
      await uploadDraft();
    } finally {
      busy = input.disabled = false;
    }
  });

  async function uploadDraft() {
    submit.hidden = true;
    status.textContent = 'Menyimpan foto…';
    try {
      await fetch(endpoint, {method: 'POST', mode: 'no-cors', body: new URLSearchParams(draft)});
      const receipt = await readAlbum({id: draft.id, guest});
      if (!receipt.directUpload) throw new Error('Deployment not updated');
      remaining = receipt.remaining;
      if (!receipt.received) throw new Error('Upload not confirmed');
      draft = null;
      status.textContent = 'Foto masuk ke album. Sisa kuota: ' + remaining + ' foto.';
      refreshGallery();
    } catch {
      submit.hidden = remaining <= 0;
      status.textContent = remaining <= 0 ? 'Kuota 10 foto sudah habis.' : 'Penyimpanan belum terkonfirmasi. Coba lagi.';
    }
  }

  const covers = Array.from(album.querySelectorAll('[data-guest-cover]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let sources = [];
  let slide = 0;
  const dialog = album.querySelector('[data-guest-dialog]');
  const detailImage = dialog.querySelector('img');
  const download = dialog.querySelector('a[download]');
  let photoUrl = null;
  let photoFile = null;
  const releasePhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = null;
    photoFile = null;
    download.removeAttribute('href');
  };
  dialog.addEventListener('close', releasePhoto);
  download.addEventListener('click', async event => {
    if (!photoFile) {
      event.preventDefault();
      return;
    }
    if (navigator.canShare?.({files: [photoFile]}) &&
        window.matchMedia('(pointer: coarse)').matches) {
      event.preventDefault();
      try {
        await navigator.share({files: [photoFile], title: 'Momen dari Tamu'});
      } catch (error) {
        if (error.name === 'AbortError') return;
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = photoFile.name;
        dialog.append(link);
        link.click();
        link.remove();
      }
    }
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  gallery.addEventListener('click', event => {
    const button = event.target.closest('button[data-photo-index]');
    if (!button) return;
    const index = Number(button.dataset.photoIndex);
    detailImage.src = sources[index];
    releasePhoto();
    const bytes = Uint8Array.from(atob(sources[index].split(',')[1]), char => char.charCodeAt(0));
    const name = 'Momen-Tamu-' + (index + 1) + '.jpg';
    photoFile = new File([bytes], name, {type: 'image/jpeg'});
    photoUrl = URL.createObjectURL(photoFile);
    download.href = photoUrl;
    download.download = name;
    dialog.showModal();
  });

  function renderGuestCover() {
    covers.forEach((image, offset) => {
      image.hidden = sources.length === 0;
      if (sources.length) image.src = sources[(slide + offset) % sources.length];
      else image.removeAttribute('src');
    });
  }
  window.setInterval(() => {
    if (document.hidden || dialog.open || reduceMotion.matches || sources.length < 2) return;
    slide = (slide + 1) % sources.length;
    renderGuestCover();
  }, 3500);

  album.hidden = false;
  input.closest('.guest-album-camera').hidden = false;
  if (!validGuest) {
    input.addEventListener('click', event => {
      event.preventDefault();
      album.scrollIntoView({block: 'start'});
    });
  }
  refreshGallery();
  if (!validGuest) {
    status.textContent = 'Buka tautan undangan yang mencantumkan nama penerima untuk mengirim foto.';
  }

  function refreshGallery() {
    readAlbum().then(({photos}) => {
    sources = photos.map(photo => 'data:image/jpeg;base64,' + photo);
    slide = 0;
    renderGuestCover();
    const cards = [];
    sources.forEach((src, index) => {
      const card = document.createElement('div');
      card.className = 'guest-photo-card';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'album-photo-open';
      button.dataset.photoIndex = String(index);
      button.setAttribute('aria-label', 'Lihat foto tamu ' + (index + 1));
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Foto momen dari tamu';
      img.loading = 'lazy';
      button.append(img);
      card.append(button);
      cards.push(card);
    });
    gallery.replaceChildren(...cards);
    if (!photos.length) gallery.textContent = 'Foto dari tamu akan muncul di sini.';
  }).catch(() => {
    gallery.textContent = 'Galeri belum bisa dimuat. Coba muat ulang halaman.';
    });
  }
}

async function preparePhoto(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error('File too large');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Gently warm the photo before saving it to the album.
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    for (let index = 0; index < pixels.length; index += 4) {
      pixels[index] *= 1.035;
      pixels[index + 1] *= 1.008;
      pixels[index + 2] *= 0.96;
    }
    context.putImageData(frame, 0, 0);
    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const photo = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      if (photo && photo.length <= 400000) return photo;
    }
    throw new Error('Photo too large');
  } finally {
    URL.revokeObjectURL(url);
  }
}
