import { WEDDING_CONFIG } from './config.js';

import {
  buildGoogleCalendarUrl,
  buildGoogleMapsUrl,
  getCountdownParts,
  isConfiguredValue
} from './wedding-utils.js';

import {
  buildRsvpPayload,
  fetchWishes,
  fetchWishesJsonp,
  submitRsvp,
  validateRsvp
} from './rsvp-api.js';


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


/* =========================================================
   CONFIG
========================================================= */

function getConfigValue(path) {
  return path
    .split('.')
    .reduce(
      (value, key) => value?.[key],
      WEDDING_CONFIG
    );
}

function populateInvitationGuest() {
  const guest = $('#invitation-guest-name');
  if (!guest) return;
  const name = new URLSearchParams(window.location.search).get('to')?.trim();
  guest.textContent = name || 'Bapak/Ibu/Saudara/i';
}

function populateConfiguredText() {
  $$('[data-config]').forEach((node) => {
    const value = getConfigValue(node.dataset.config);
    if (value !== undefined && value !== null) {
      node.textContent = String(value);
    }
  });

  const browserTitle = WEDDING_CONFIG.site?.browserTitle;
  document.title = browserTitle || 'Dhanan & Berliana | Undangan Pernikahan';
}

/* =========================================================
   GOOGLE MAPS + CALENDAR
========================================================= */

function setupExternalLinks() {
  const mapsLink =
    $('#maps-link');

  const eventMapsLink =
    $('#event-maps-link');

  const primaryCalendarLink =
    $('#calendar-link');

  const giftDeliveryLink =
    $('#gift-delivery-link');


  const eventMapsUrl =
    isConfiguredValue(
      WEDDING_CONFIG.event.mapsUrl
    )
      ? WEDDING_CONFIG.event.mapsUrl
      : buildGoogleMapsUrl(
          WEDDING_CONFIG.event.venueAddress
        );


  if (mapsLink) {
    mapsLink.href = eventMapsUrl;
  }

  if (eventMapsLink) {
    eventMapsLink.href =
      eventMapsUrl;
  }


  if (
    primaryCalendarLink &&
    !primaryCalendarLink.dataset.calendarEvent
  ) {
    primaryCalendarLink.href =
      buildGoogleCalendarUrl({
        title:
          WEDDING_CONFIG.event.title,

        start:
          WEDDING_CONFIG.event.start,

        end:
          WEDDING_CONFIG.event.end,

        location:
          WEDDING_CONFIG.event.venueAddress,

        description:
          WEDDING_CONFIG.event.description
      });
  }


  $$('[data-calendar-event]').forEach(
    (link) => {
      const event =
        WEDDING_CONFIG.events?.[
          link.dataset.calendarEvent
        ];

      if (!event) return;

      link.href =
        buildGoogleCalendarUrl({
          title:
            event.title,

          start:
            event.start,

          end:
            event.end,

          location:
            event.venueAddress,

          description:
            event.description
        });
    }
  );


  $$('[data-maps-event]').forEach(
    (link) => {
      const event =
        WEDDING_CONFIG.events?.[
          link.dataset.mapsEvent
        ];

      if (!event) return;

      link.href =
        isConfiguredValue(event.mapsUrl)
          ? event.mapsUrl
          : buildGoogleMapsUrl(
              event.venueAddress
            );
    }
  );


  if (giftDeliveryLink) {
    giftDeliveryLink.href =
      isConfiguredValue(
        WEDDING_CONFIG.gift
          .deliveryAddressUrl
      )
        ? WEDDING_CONFIG.gift
            .deliveryAddressUrl
        : buildGoogleMapsUrl(
            WEDDING_CONFIG.gift
              .deliveryAddress
          );
  }
}


/* =========================================================
   OPENING COVER
========================================================= */

function setupOpeningCover() {
  const cover = $('#opening-cover');
  const button = $('#open-invitation');
  const hero = $('#home');
  const audio = $('#background-music');
  const musicToggle = $('#music-toggle');

  if (!cover || !button) return;

  button.addEventListener(
    'click',
    () => {
      // Tutup cover utama.
      cover.classList.add('is-open');
      cover.setAttribute('aria-hidden', 'true');
      cover.style.pointerEvents = 'none';

      // Lepas semua scroll lock, termasuk fallback untuk Safari/iPhone.
      document.body.classList.remove('is-locked');
      document.documentElement.classList.remove('is-locked');

      [document.body, document.documentElement].forEach((element) => {
        element.style.removeProperty('overflow');
        element.style.removeProperty('overflow-y');
        element.style.removeProperty('position');
        element.style.removeProperty('top');
        element.style.removeProperty('height');
        element.style.removeProperty('touch-action');
      });

      // Pastikan hero/home aktif dan viewport kembali ke awal halaman.
      hero?.classList.add('hero--entered');

      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
      });

      // Musik tidak boleh menggagalkan proses membuka undangan.
      if (!audio) return;

      audio.volume = 0.65;
      audio.muted = false;

      const playPromise = audio.play();

      if (
        playPromise &&
        typeof playPromise.then === 'function'
      ) {
        playPromise
          .then(() => {
            if (!musicToggle) return;

            musicToggle.setAttribute(
              'aria-pressed',
              'true'
            );

            musicToggle.setAttribute(
              'aria-label',
              'Jeda musik latar'
            );
          })
          .catch((error) => {
            console.warn(
              'Browser memblokir musik otomatis:',
              error
            );

            if (!musicToggle) return;

            musicToggle.setAttribute(
              'aria-pressed',
              'false'
            );

            musicToggle.setAttribute(
              'aria-label',
              'Putar musik latar'
            );
          });
      }
    },
    { once: true }
  );
}


/* =========================================================
   MUSIC
========================================================= */

function setupMusic() {
  const button =
    $('#music-toggle');

  const audio =
    $('#background-music');

  if (!button || !audio) return;


  const syncButton = () => {
    const playing =
      !audio.paused;

    button.setAttribute(
      'aria-pressed',
      playing ? 'true' : 'false'
    );

    button.setAttribute(
      'aria-label',
      playing
        ? 'Jeda musik latar'
        : 'Putar musik latar'
    );
  };


  button.addEventListener(
    'click',
    async () => {

      if (audio.paused) {

        try {
          await audio.play();
        } catch {
          button.setAttribute(
            'aria-pressed',
            'false'
          );
        }

      } else {
        audio.pause();
      }

      syncButton();
    }
  );


  audio.addEventListener(
    'play',
    syncButton
  );

  audio.addEventListener(
    'pause',
    syncButton
  );

  audio.addEventListener(
    'ended',
    syncButton
  );

  syncButton();
}


/* =========================================================
   STORY SLIDER
========================================================= */

function setupStorySlider() {
  const slider =
    $('#story-slider');

  if (!slider) return;


  const track =
    $('.story-slider__track', slider);

  const slides =
    $$('[data-story-slide]', slider);

  const dots =
    $$('[data-story-dot]', slider);

  const prev =
    $('[data-story-prev]', slider);

  const next =
    $('[data-story-next]', slider);


  if (
    !track ||
    slides.length < 2
  ) {
    return;
  }


  let index = 0;
  let timer = null;


  const reduceMotion =
    window
      .matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      )
      .matches;


  const render = () => {
    track.style.transform =
      `translateX(-${index * 100}%)`;

    dots.forEach(
      (dot, dotIndex) => {

        dot.setAttribute(
          'aria-current',
          dotIndex === index
            ? 'true'
            : 'false'
        );

      }
    );
  };


  const goTo = (nextIndex) => {
    index =
      (
        nextIndex +
        slides.length
      ) %
      slides.length;

    render();
  };


  const stopAuto = () => {
    if (!timer) return;

    clearInterval(timer);
    timer = null;
  };


  const startAuto = () => {
    stopAuto();

    if (
      reduceMotion ||
      document.hidden
    ) {
      return;
    }

    timer =
      setInterval(
        () => goTo(index + 1),
        5000
      );
  };


  prev?.addEventListener(
    'click',
    () => {
      goTo(index - 1);
      startAuto();
    }
  );


  next?.addEventListener(
    'click',
    () => {
      goTo(index + 1);
      startAuto();
    }
  );


  dots.forEach((dot) => {
    dot.addEventListener(
      'click',
      () => {
        goTo(
          Number(
            dot.dataset.storyDot
          )
        );

        startAuto();
      }
    );
  });


  slider.addEventListener(
    'mouseenter',
    stopAuto
  );

  slider.addEventListener(
    'mouseleave',
    startAuto
  );

  slider.addEventListener(
    'focusin',
    stopAuto
  );

  slider.addEventListener(
    'focusout',
    startAuto
  );


  document.addEventListener(
    'visibilitychange',
    () => {
      document.hidden
        ? stopAuto()
        : startAuto();
    }
  );


  render();
  startAuto();
}


/* =========================================================
   STORY GALLERY / LIGHTBOX
========================================================= */

/* =========================================================
   COUNTDOWN
========================================================= */

function updateCountdown() {
  const fields = {
    days:
      $('#countdown-days'),

    hours:
      $('#countdown-hours'),

    minutes:
      $('#countdown-minutes'),

    seconds:
      $('#countdown-seconds')
  };


  const note =
    $('#countdown-note');


  const parts =
    getCountdownParts(
      WEDDING_CONFIG.event.start
    );


  if (!parts.valid) {

    Object.values(fields)
      .forEach((node) => {

        if (node) {
          node.textContent = '--';
        }

      });


    if (note) {
      note.textContent =
        'Tanggal pernikahan akan segera diumumkan.';
    }

    return;
  }


  Object.entries(fields)
    .forEach(([key, node]) => {

      if (!node) return;

      node.textContent =
        String(parts[key])
          .padStart(2, '0');

    });


  if (note) {
    note.textContent =
      parts.complete
        ? 'Hari bahagia kami telah tiba. Sampai bertemu!'
        : '';
  }
}


function setupCountdown() {
  const countdown =
    $('#countdown');

  if (!countdown) return;


  updateCountdown();

  window.setInterval(
    updateCountdown,
    1000
  );
}


/* =========================================================
   REVEAL ANIMATION
========================================================= */

function setupRevealAnimations() {
  const elements =
    $$('.reveal');

  if (!elements.length) return;


  if (
    !(
      'IntersectionObserver'
      in window
    )
  ) {

    elements.forEach(
      (element) =>
        element.classList.add(
          'is-visible'
        )
    );

    return;
  }

  const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add('is-visible');
    entry.target.classList.remove('reveal-pending');
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.01,
  rootMargin: '0px 0px 40px 0px'
});


  elements.forEach(
    (element) =>
      { element.classList.add('reveal-pending'); observer.observe(element); }
  );
}


/* =========================================================
   RSVP FORM
========================================================= */

function setFieldError(
  field,
  message = ''
) {

  const errorMap = {
    fullName:
      $('#full-name-error'),

    attendance:
      $('#attendance-error')
  };


  if (errorMap[field]) {
    errorMap[field].textContent =
      message;
  }
}


function clearFormErrors() {
  setFieldError('fullName');
  setFieldError('attendance');
}


function getFormValues(form) {
  const data =
    new FormData(form);


  const attendance =
    data.get('attendance') || '';


  let guests =
    Number(
      data.get('guests') || 1
    );


  if (
    attendance ===
    'not-attending'
  ) {
    guests = 0;
  }


  return {
    fullName:
      String(
        data.get('fullName') || ''
      ).trim(),

    attendance,

    guests,

    message:
      String(
        data.get('message') || ''
      ).trim()
  };
}


/* =========================================================
   ATTENDANCE TOGGLE
========================================================= */

function setupAttendanceToggle() {
  const group =
    $('#guest-count-group');

  const guestInput =
    $('#guest-count');

  const radios =
    $$(
      'input[name="attendance"]'
    );


  if (
    !group ||
    !radios.length
  ) {
    return;
  }


  const sync = () => {

    const checked =
      $(
        'input[name="attendance"]:checked'
      );


    const notAttending =
      checked?.value ===
      'not-attending';


    group.hidden =
      notAttending;


    if (guestInput) {

      if (notAttending) {
        guestInput.value = '1';

      } else if (
        Number(guestInput.value) < 1
      ) {
        guestInput.value = '1';
      }

    }
  };


  radios.forEach(
    (radio) => {
      radio.addEventListener(
        'change',
        sync
      );
    }
  );


  sync();


  return sync;
}


/* =========================================================
   WISH CARDS
========================================================= */

function createWishCard(wish) {
  const card =
    document.createElement(
      'article'
    );

  card.className =
    'wish-card';


  const name =
    document.createElement(
      'h3'
    );

  name.textContent =
    String(
      wish.name ||
      'Tamu'
    );


  const message =
    document.createElement(
      'p'
    );

  message.textContent =
    String(
      wish.message || ''
    );


  card.append(
    name,
    message
  );


  if (wish.timestamp) {

    const date =
      new Date(
        wish.timestamp
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      const time =
        document.createElement(
          'time'
        );


      time.dateTime =
        date.toISOString();


      time.textContent =
        new Intl.DateTimeFormat(
          'id-ID',
          {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }
        ).format(date);


      card.append(time);
    }
  }


  return card;
}


/* =========================================================
   RENDER WISHES
========================================================= */

let wishesRenderSnapshot = null;
let wishesAnimationObserver = null;

function animateWishCards(list) {
  if (wishesAnimationObserver) wishesAnimationObserver.disconnect();
  const cards = $$('.wish-card', list);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const reveal = (card) => {
    if (typeof card.animate === 'function') {
      card.animate(
        [{ opacity: .35, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 450, easing: 'ease-out' }
      );
    }
  };
  if (!('IntersectionObserver' in window)) {
    cards.forEach(reveal);
    return;
  }
  wishesAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      wishesAnimationObserver.unobserve(entry.target);
    });
  }, { threshold: .05 });
  cards.forEach((card) => wishesAnimationObserver.observe(card));
}

function renderWishes(wishes = []) {
  const wishesList =
    $('#wishes-list');

  if (!wishesList) return;

  const snapshot = JSON.stringify(wishes);
  if (snapshot === wishesRenderSnapshot) return;
  wishesRenderSnapshot = snapshot;

  wishesList.replaceChildren();


  if (!wishes.length) {

    const empty =
      document.createElement(
        'p'
      );

    empty.className =
      'wishes-empty';


    empty.textContent =
      isConfiguredValue(
        WEDDING_CONFIG.integration
          .appsScriptUrl
      )
        ? 'Belum ada ucapan. Jadilah yang pertama memberikan doa dan pesan.'
        : 'Ucapan pernikahan akan tampil setelah integrasi RSVP tersambung.';


    wishesList.append(empty);

    return;
  }


  const fragment =
    document.createDocumentFragment();


  wishes.forEach(
    (wish) => {
      fragment.append(
        createWishCard(wish)
      );
    }
  );


  wishesList.append(fragment);
  animateWishCards(wishesList);
}


/* =========================================================
   LOAD WISHES
========================================================= */

let isLoadingWishes = false;


async function loadWishes() {

  if (isLoadingWishes) return;


  if (
    !isConfiguredValue(
      WEDDING_CONFIG.integration
        .appsScriptUrl
    )
  ) {

    renderWishes([]);

    return;
  }


  isLoadingWishes = true;


  try {

    const wishes =
      await fetchWishes(
        WEDDING_CONFIG.integration
          .appsScriptUrl
      );


    renderWishes(
      Array.isArray(wishes)
        ? wishes
        : []
    );


  } catch (error) {

    try {

      const wishes =
        await fetchWishesJsonp(
          WEDDING_CONFIG.integration
            .appsScriptUrl
        );


      renderWishes(
        Array.isArray(wishes)
          ? wishes
          : []
      );


    } catch (fallbackError) {

      console.warn(
        'Tidak dapat memperbarui ucapan pernikahan.',
        error,
        fallbackError
      );

    }

  } finally {

    isLoadingWishes = false;

  }
}


/* =========================================================
   WISH POLLING
========================================================= */

function setupWishesPolling() {
  loadWishes();


  window.setInterval(
    () => {

      if (!document.hidden) {
        loadWishes();
      }

    },
    15000
  );


  document.addEventListener(
    'visibilitychange',
    () => {

      if (!document.hidden) {
        loadWishes();
      }

    }
  );
}


/* =========================================================
   RSVP SUBMISSION
========================================================= */

function setupRsvp(
  syncAttendance
) {

  const form =
    $('#rsvp-form');

  const submitButton =
    $('#rsvp-submit');

  const status =
    $('#rsvp-status');


  if (
    !form ||
    !submitButton ||
    !status
  ) {
    return;
  }


  form.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      clearFormErrors();


      status.textContent = '';
      status.className =
        'form-status';


      const values =
        getFormValues(form);


      const validation =
        validateRsvp(values);


      if (!validation.valid) {

        Object.entries(
          validation.errors
        ).forEach(
          ([field, message]) => {
            setFieldError(
              field,
              message
            );
          }
        );


        status.textContent =
          'Mohon lengkapi data yang diperlukan.';

        status.classList.add(
          'is-error'
        );

        return;
      }


      if (
        !isConfiguredValue(
          WEDDING_CONFIG.integration
            .appsScriptUrl
        )
      ) {

        status.textContent =
          'RSVP belum terhubung ke Google Sheets. Silakan konfigurasi URL Apps Script terlebih dahulu.';

        status.classList.add(
          'is-error'
        );

        return;
      }


      const payload =
        buildRsvpPayload(values);


      const originalLabel = [...submitButton.childNodes].map(node => node.cloneNode(true));


      submitButton.disabled =
        true;

      submitButton.textContent =
        'Mengirim…';


      try {

        await submitRsvp(
          WEDDING_CONFIG.integration
            .appsScriptUrl,
          payload
        );


        status.textContent =
          payload.attendance ===
          'attending'
            ? 'Terima kasih. Kami tidak sabar merayakan hari bahagia ini bersama Anda.'
            : 'Terima kasih sudah memberikan konfirmasi. Doa dan ucapan Anda sangat berarti bagi kami.';


        status.classList.add(
          'is-success'
        );


        form.reset();


        const guestInput =
          $('#guest-count');

        if (guestInput) {
          guestInput.value = '1';
        }


        if (
          typeof syncAttendance ===
          'function'
        ) {
          syncAttendance();
        }


        await loadWishes();


      } catch (error) {

        console.error(
          'RSVP submission error:',
          error
        );


        status.textContent =
          'Konfirmasi belum berhasil disimpan. Silakan coba beberapa saat lagi.';

        status.classList.add(
          'is-error'
        );


      } finally {

        submitButton.disabled =
          false;

        submitButton.replaceChildren(...originalLabel);

      }

    }
  );
}

/* =========================================================
   BANK COPY
========================================================= */

function setupBankAccountCopy() {
  $$('[data-gift-account]').forEach((card) => {
    const button = $('[data-copy-account]', card);
    const account = $('[data-account-number]', card);
    const status = $('[data-copy-status]', card);
    if (!button || !account || !status) return;
    let resetTimer;
    button.addEventListener('click', async () => {
      const value = account.textContent.trim();
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Tersalin ✓';
        status.textContent = 'Nomor rekening berhasil disalin.';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.textContent = 'Copy';
          status.textContent = '';
        }, 1800);
      } catch {
        status.textContent = 'Tidak dapat menyalin otomatis. Tekan dan tahan nomor rekening untuk menyalin.';
      }
    });
  });
}

/* =========================================================
   INITIALISATION
========================================================= */


function setupInlineAlbumSlider() {
  const dropdown = $('.story-album-dropdown');
  const sliders = $$('[data-album-slider]', dropdown);
  if (!dropdown || !sliders.length) return;
  const photoDialog = $('#album-photo-dialog');
  const photoImage = $('.album-photo-dialog__image', photoDialog);
  const photoClose = $('[data-album-photo-close]', photoDialog);
  const photoDownload = $('[data-album-photo-download]', photoDialog);
  if (!photoDialog || !photoImage || !photoClose) return;
  let downloadUrl = null;
  let downloadVersion = 0;
  const resetDownload = () => {
    downloadVersion += 1;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
    photoDownload?.removeAttribute('href');
    photoDownload?.setAttribute('aria-disabled', 'true');
  };
  const preparePngDownload = async (source) => {
    resetDownload();
    if (!photoDownload) return;
    const version = downloadVersion;
    photoDownload.setAttribute('aria-busy', 'true');
    photoDownload.title = 'Menyiapkan PNG…';
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(image, 0, 0);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG conversion failed')), 'image/png');
      });
      if (version !== downloadVersion) return;
      downloadUrl = URL.createObjectURL(blob);
      photoDownload.href = downloadUrl;
      const name = new URL(source, document.baseURI).pathname.split('/').pop().replace(/\.[^.]+$/, '');
      photoDownload.download = 'Dhanan-Berliana-' + name + '.png';
      photoDownload.removeAttribute('aria-disabled');
      photoDownload.title = 'Download foto PNG';
    } catch (error) {
      if (version !== downloadVersion) return;
      photoDownload.title = 'Gagal menyiapkan PNG. Tutup dan buka foto untuk mencoba lagi.';
    } finally {
      if (version === downloadVersion) photoDownload.removeAttribute('aria-busy');
    }
  };
  photoDownload?.addEventListener('click', (event) => {
    if (!downloadUrl) event.preventDefault();
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = sliders.map((slider) => {
    const track = $('.album-auto-slider__track', slider);
    const slides = $$('.album-auto-slider__slide', slider);
    const count = Number(slider.dataset.photoCount);
    const perView = Number(slider.dataset.slidesPerView) || 3;
    if (!track || count < 3) return null;
  let index = 0;
  let timer = null;
  const render = () => {
    track.style.transform = 'translateX(-' + (index * 100 / perView) + '%)';
    slides.forEach((slide, i) => slide.classList.toggle('is-center', i === index + Math.floor(perView / 2)));
  };
  const snap = (value) => {
    track.style.transition = 'none';
    index = value;
    render();
    void track.offsetWidth;
    track.style.transition = '';
  };
  const move = (direction) => {
    if (index >= count) snap(0);
    if (direction < 0 && index === 0) snap(count);
    index += direction;
    if (reduceMotion.matches) index = (index + count) % count;
    render();
  };
  const stop = () => { window.clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (!dropdown.open || photoDialog.open || document.hidden || reduceMotion.matches) return;
    timer = window.setInterval(() => move(1), 3500);
  };

    track.addEventListener('transitionend', (event) => {
      if (event.target === track && event.propertyName === 'transform' && index >= count) snap(0);
    });
    render();
    return { start, stop };
  }).filter(Boolean);
  const stop = () => controls.forEach((control) => control.stop());
  const start = () => controls.forEach((control) => control.start());
  $$('[data-album-photo]', dropdown).forEach((button) => {
    button.addEventListener('click', () => {
      const image = $('img', button);
      if (!image) return;
      if (typeof photoDialog.showModal !== 'function') {
        window.open(image.src, '_blank', 'noopener,noreferrer');
        return;
      }
      stop();
      photoImage.src = image.currentSrc || image.src;
      preparePngDownload(photoImage.src);
      photoImage.alt = image.alt || 'Foto pranikah Dhanan dan Berliana';
      photoDialog.showModal();
      document.body.classList.add('is-album-photo-open');
    });
  });
  photoClose.addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', (event) => {
    if (event.target === photoDialog) photoDialog.close();
  });
  photoDialog.addEventListener('close', () => {
    resetDownload();
    document.body.classList.remove('is-album-photo-open');
    start();
  });
  dropdown.addEventListener('toggle', start);
  document.addEventListener('visibilitychange', start);
  reduceMotion.addEventListener('change', start);
  start();
}

function setupAlbumCoverPreview() {
  const album = $('.story-inline-album.story-stack-card');
  if (!album) return;
  const baliPhotos = $$('.story-album-dropdown > .story-inline-gallery img', album);
  const aquariumPhotos = $$('.moments-together__gallery img', album);
  const photos = baliPhotos.flatMap((photo, index) =>
    aquariumPhotos.length ? [photo, aquariumPhotos[index % aquariumPhotos.length]] : [photo]
  );
  const front = $('.story-stack-card__photo--front img', album);
  const middle = $('.story-stack-card__photo--middle img', album);
  const back = $('.story-stack-card__photo--back img', album);
  if (photos.length < 3 || !front || !middle || !back) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer = null;
  const render = () => {
    [front, middle, back].forEach((image, offset) => {
      const source = photos[(index + offset) % photos.length];
      image.src = source.src;
      image.alt = offset === 0 ? source.alt : '';
    });
  };
  const sync = () => {
    window.clearInterval(timer);
    timer = null;
    if (document.hidden || motion.matches) return;
    timer = window.setInterval(() => {
      if ($('#album-photo-dialog')?.open) return;
      index = (index + 1) % photos.length;
      render();
    }, 3500);
  };
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  render();
  sync();
}

function setupSmoothAlbumDropdown() {
  const dropdown = $('.story-album-dropdown');
  const summary = dropdown && $('summary', dropdown);
  if (!dropdown || !summary || typeof dropdown.animate !== 'function') return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null;
  summary.addEventListener('click', (event) => {
    if (motion.matches) return;
    event.preventDefault();
    const opening = !dropdown.open;
    const from = dropdown.getBoundingClientRect().height;
    if (animation) animation.cancel();
    const closedHeight = summary.getBoundingClientRect().height;
    if (opening) dropdown.open = true;
    const to = opening ? dropdown.getBoundingClientRect().height : closedHeight;
    dropdown.style.overflow = 'hidden';
    const current = dropdown.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
      { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    animation = current;
    current.onfinish = () => {
      if (animation !== current) return;
      dropdown.open = opening;
      dropdown.style.overflow = '';
      animation = null;
    };
  });
}

function init() {
  setupRevealAnimations();
  // Daftarkan tombol pembuka lebih dulu supaya tetap bekerja
  // walaupun ada konfigurasi fitur lain yang belum lengkap.
  setupOpeningCover();

  setupMusic();

  populateConfiguredText();

  populateInvitationGuest();

  setupExternalLinks();

  setupStorySlider();

  setupAlbumCoverPreview();

  setupInlineAlbumSlider();

  setupSmoothAlbumDropdown();


  setupCountdown();

  const syncAttendance =
    setupAttendanceToggle();

  setupRsvp(
    syncAttendance
  );

  setupWishesPolling();

  setupBankAccountCopy();
}


init();
