import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateRsvp,
  buildRsvpPayload,
  submitRsvp,
  fetchWishes
} from '../assets/js/rsvp-api.js';

test('validateRsvp requires name and attendance', () => {
  const result = validateRsvp({ fullName: ' ', attendance: '', guests: 1, message: '' });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, {
    fullName: 'Please enter your full name.',
    attendance: 'Please confirm your attendance.'
  });
});

test('validateRsvp accepts a complete attending submission', () => {
  const result = validateRsvp({ fullName: 'Ade Fitriyani', attendance: 'attending', guests: 2, message: 'Best wishes!' });
  assert.deepEqual(result, { valid: true, errors: {} });
});

test('buildRsvpPayload normalizes name guest count and message', () => {
  assert.deepEqual(
    buildRsvpPayload({ fullName: '  Ade Fitriyani ', attendance: 'attending', guests: '12', message: '  Best wishes!  ' }),
    { fullName: 'Ade Fitriyani', attendance: 'attending', guests: 10, message: 'Best wishes!' }
  );
  assert.equal(buildRsvpPayload({ fullName: 'A', attendance: 'not-attending', guests: 4, message: '' }).guests, 0);
});

test('submitRsvp rejects an unconfigured endpoint before sending', async () => {
  let called = false;
  const fakeFetch = async () => { called = true; };
  await assert.rejects(
    submitRsvp('XXX', { fullName: 'Ade', attendance: 'attending', guests: 1, message: '' }, fakeFetch),
    /Apps Script URL is not configured/
  );
  assert.equal(called, false);
});

test('submitRsvp posts urlencoded fields and returns parsed JSON', async () => {
  let captured;
  const fakeFetch = async (url, options) => {
    captured = { url, options };
    return { ok: true, json: async () => ({ ok: true, submissionId: 'abc-123' }) };
  };
  const result = await submitRsvp(
    'https://script.google.com/macros/s/example/exec',
    { fullName: 'Ade', attendance: 'attending', guests: 2, message: 'Congrats' },
    fakeFetch
  );
  assert.equal(result.submissionId, 'abc-123');
  assert.equal(captured.options.method, 'POST');
  assert.equal(captured.options.body.get('fullName'), 'Ade');
  assert.equal(captured.options.body.get('attendance'), 'attending');
  assert.equal(captured.options.body.get('guests'), '2');
});

test('fetchWishes asks for action=wishes and normalizes missing wishes', async () => {
  let requestedUrl = '';
  const fakeFetch = async (url) => {
    requestedUrl = url;
    return { ok: true, json: async () => ({ ok: true }) };
  };
  const wishes = await fetchWishes('https://script.google.com/macros/s/example/exec', fakeFetch);
  assert.equal(new URL(requestedUrl).searchParams.get('action'), 'wishes');
  assert.deepEqual(wishes, []);
});

test('submitRsvp uses no-cors so static GitHub Pages can post to Apps Script', async () => {
  let mode;
  const fakeFetch = async (_url, options) => {
    mode = options.mode;
    return { type: 'opaque', ok: false, status: 0 };
  };
  const result = await submitRsvp(
    'https://script.google.com/macros/s/example/exec',
    { fullName: 'Ade', attendance: 'attending', guests: 1, message: '' },
    fakeFetch
  );
  assert.equal(mode, 'no-cors');
  assert.deepEqual(result, { ok: true, opaque: true });
});

test('rsvp API exposes JSONP fallback for read-only wishes', async () => {
  const module = await import('../assets/js/rsvp-api.js');
  assert.equal(typeof module.fetchWishesJsonp, 'function');
});
