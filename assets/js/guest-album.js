const album = document.querySelector('#guest-album');
const endpoint = album?.dataset.endpoint;
if (endpoint && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
  startAlbum();
}

function startAlbum() {
  const form = album.querySelector('form');
  const input = form.querySelector('input[type=file]');
  const submit = form.querySelector('button');
  const status = album.querySelector('[role=status]');
  const preview = album.querySelector('[data-preview]');
  const gallery = album.querySelector('[data-gallery]');
  const randomId = () => crypto.randomUUID().replaceAll('-', '');
  let draft;
  let selection = 0;

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

  input.addEventListener('change', async () => {
    const current = ++selection;
    draft = null;
    submit.disabled = true;
    preview.hidden = true;
    if (!input.files[0]) return;
    status.textContent = 'Menyiapkan foto…';
    try {
      const photo = await preparePhoto(input.files[0]);
      if (current !== selection) return;
      draft = {id: randomId(), photo};
      preview.src = 'data:image/jpeg;base64,' + photo;
      preview.hidden = false;
      submit.disabled = false;
      status.textContent = 'Foto siap dikirim.';
    } catch {
      if (current === selection) status.textContent = 'Foto belum bisa dibaca. Coba ambil ulang.';
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!draft || submit.disabled) return;
    submit.disabled = input.disabled = true;
    status.textContent = 'Mengirim foto…';
    try {
      await fetch(endpoint, {method: 'POST', mode: 'no-cors', body: new URLSearchParams(draft)});
      const receipt = await readAlbum({id: draft.id});
      if (!receipt.received) throw new Error('Upload not confirmed');
      draft = null;
      form.reset();
      preview.hidden = true;
      preview.removeAttribute('src');
      status.textContent = 'Foto diterima dan menunggu persetujuan.';
    } catch {
      status.textContent = 'Pengiriman belum terkonfirmasi. Coba kirim lagi.';
    } finally {
      input.disabled = false;
      submit.disabled = !draft;
    }
  });

  album.hidden = false;
  readAlbum().then(({photos}) => {
    gallery.replaceChildren(...photos.map(photo => {
      const img = document.createElement('img');
      img.src = 'data:image/jpeg;base64,' + photo;
      img.alt = 'Foto momen dari tamu';
      img.loading = 'lazy';
      return img;
    }));
    if (!photos.length) gallery.textContent = 'Foto yang disetujui akan muncul di sini.';
  }).catch(() => {
    gallery.textContent = 'Galeri belum bisa dimuat. Coba muat ulang halaman.';
  });
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
