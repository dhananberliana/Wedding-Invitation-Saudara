import { formatGuestCount, isConfiguredValue } from './wedding-utils.js';

export function validateRsvp({ fullName, attendance }) {
  const errors = {};

  if (!String(fullName ?? '').trim()) {
    errors.fullName = 'Please enter your full name.';
  }

  if (!['attending', 'not-attending'].includes(attendance)) {
    errors.attendance = 'Please confirm your attendance.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function buildRsvpPayload({ fullName, attendance, guests, message }) {
  return {
    fullName: String(fullName ?? '').trim(),
    attendance,
    guests: formatGuestCount(attendance, guests),
    message: String(message ?? '').trim()
  };
}

export async function submitRsvp(endpoint, payload, fetchImpl = fetch) {
  if (!isConfiguredValue(endpoint)) {
    throw new Error('Apps Script URL is not configured.');
  }

  const body = new URLSearchParams();
  Object.entries(buildRsvpPayload(payload)).forEach(([key, value]) => {
    body.set(key, String(value));
  });

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    body,
    mode: 'no-cors',
    redirect: 'follow'
  });

  if (response.type === 'opaque') {
    return { ok: true, opaque: true };
  }

  if (!response.ok) {
    throw new Error(`RSVP request failed with status ${response.status}.`);
  }

  const data = await response.json();
  if (!data?.ok) {
    throw new Error(data?.error || 'RSVP submission was not accepted.');
  }
  return data;
}

export async function fetchWishes(endpoint, fetchImpl = fetch) {
  if (!isConfiguredValue(endpoint)) return [];

  const url = new URL(endpoint);
  url.searchParams.set('action', 'wishes');
  url.searchParams.set('_', String(Date.now()));

  const response = await fetchImpl(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`Wishes request failed with status ${response.status}.`);
  }

  const data = await response.json();
  if (!data?.ok) {
    throw new Error(data?.error || 'Unable to load wishes.');
  }

  return Array.isArray(data.wishes) ? data.wishes : [];
}


export function fetchWishesJsonp(endpoint, options = {}) {
  if (!isConfiguredValue(endpoint)) return Promise.resolve([]);

  const documentRef = options.documentRef ?? globalThis.document;
  const globalRef = options.globalRef ?? globalThis;
  const timeoutMs = options.timeoutMs ?? 8000;

  if (!documentRef?.createElement || !documentRef?.head) {
    return Promise.reject(new Error('JSONP is only available in a browser document.'));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__weddingWishes_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = documentRef.createElement('script');
    const url = new URL(endpoint);
    url.searchParams.set('action', 'wishes');
    url.searchParams.set('prefix', callbackName);
    url.searchParams.set('_', String(Date.now()));

    let settled = false;
    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete globalRef[callbackName]; } catch { globalRef[callbackName] = undefined; }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Wishes request timed out.'));
    }, timeoutMs);

    globalRef[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      if (!data?.ok) {
        reject(new Error(data?.error || 'Unable to load wishes.'));
        return;
      }
      resolve(Array.isArray(data.wishes) ? data.wishes : []);
    };

    script.async = true;
    script.src = url.toString();
    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('Unable to load wishes through JSONP.'));
    };
    documentRef.head.appendChild(script);
  });
}
