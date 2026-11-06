import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCountdownParts,
  buildGoogleMapsUrl,
  buildGoogleCalendarUrl,
  isConfiguredValue,
  formatGuestCount
} from '../assets/js/wedding-utils.js';

test('getCountdownParts returns day/hour/minute/second values for a future instant', () => {
  const now = new Date('2026-08-21T10:00:00+08:00');
  const target = '2026-08-22T12:03:04+08:00';
  assert.deepEqual(getCountdownParts(target, now), {
    totalMs: 93784000,
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
    complete: false,
    valid: true
  });
});

test('getCountdownParts clamps completed countdown to zero', () => {
  const now = new Date('2026-08-21T10:00:00+08:00');
  assert.deepEqual(getCountdownParts('2026-08-20T10:00:00+08:00', now), {
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    complete: true,
    valid: true
  });
});

test('getCountdownParts marks placeholder date as invalid', () => {
  assert.equal(getCountdownParts('XXX').valid, false);
});

test('buildGoogleMapsUrl creates a Google Maps directions URL from an address', () => {
  const url = buildGoogleMapsUrl('Gedung Serbaguna, Denpasar, Bali');
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  assert.match(url, /Gedung%20Serbaguna/);
});

test('buildGoogleCalendarUrl includes title dates venue and description', () => {
  const url = buildGoogleCalendarUrl({
    title: 'The Wedding of A & B',
    start: '2026-09-10T10:00:00+08:00',
    end: '2026-09-10T12:00:00+08:00',
    location: 'Bali',
    description: 'Join our celebration'
  });
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
  assert.match(url, /text=The\+Wedding\+of\+A\+%26\+B/);
  assert.match(url, /dates=20260910T020000Z%2F20260910T040000Z/);
  assert.match(url, /location=Bali/);
  assert.match(url, /details=Join\+our\+celebration/);
});

test('isConfiguredValue rejects blank and XXX placeholders', () => {
  assert.equal(isConfiguredValue('XXX'), false);
  assert.equal(isConfiguredValue('  xxx  '), false);
  assert.equal(isConfiguredValue(''), false);
  assert.equal(isConfiguredValue('https://example.com'), true);
});

test('formatGuestCount uses zero for not attending and clamps attending guests', () => {
  assert.equal(formatGuestCount('not-attending', 3), 0);
  assert.equal(formatGuestCount('attending', 0), 1);
  assert.equal(formatGuestCount('attending', 11), 10);
  assert.equal(formatGuestCount('attending', '2'), 2);
});
