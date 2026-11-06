export function isConfiguredValue(value) {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim();
  return normalized.length > 0 && normalized.toLowerCase() !== 'xxx';
}

export function getCountdownParts(targetDateTime, now = new Date()) {
  if (!isConfiguredValue(targetDateTime)) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: false,
      valid: false
    };
  }

  const target = new Date(targetDateTime);
  const nowDate = now instanceof Date ? now : new Date(now);

  if (Number.isNaN(target.getTime()) || Number.isNaN(nowDate.getTime())) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: false,
      valid: false
    };
  }

  const rawMs = target.getTime() - nowDate.getTime();
  const totalMs = Math.max(0, rawMs);
  const totalSeconds = Math.floor(totalMs / 1000);

  return {
    totalMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    complete: rawMs <= 0,
    valid: true
  };
}

export function buildGoogleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? '')}`;
}

function toGoogleDate(dateTime) {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildGoogleCalendarUrl({ title, start, end, location, description }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title ?? '',
    location: location ?? '',
    details: description ?? ''
  });

  const startDate = toGoogleDate(start);
  const endDate = toGoogleDate(end);
  if (startDate && endDate) {
    params.set('dates', `${startDate}/${endDate}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatGuestCount(attendance, guests) {
  if (attendance !== 'attending') return 0;
  const parsed = Number.parseInt(guests, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(10, Math.max(1, parsed));
}
