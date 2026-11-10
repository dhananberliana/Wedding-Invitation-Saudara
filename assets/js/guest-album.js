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

  const cover = album.querySelector('[data-guest-cover]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let sources = [];
  let slide = 0;
  window.setInterval(() => {
    if (!cover || document.hidden || reduceMotion.matches || sources.length < 2) return;
    slide = (slide + 1) % sources.length;
    cover.src = sources[slide];
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
    if (cover) {
      cover.hidden = !sources.length;
      if (sources.length) cover.src = sources[0];
    }
    gallery.replaceChildren(...photos.map(photo => {
      const img = document.createElement('img');
      img.src = 'data:image/jpeg;base64,' + photo;
      img.alt = 'Foto momen dari tamu';
      img.loading = 'lazy';
      return img;
    }));
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
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const photo = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      if (photo && photo.length <= 400000) return photo;
    }
    throw new Error('Photo too large');
  } finally {
    URL.revokeObjectURL(url);
  }
}
