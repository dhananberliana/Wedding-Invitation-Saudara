import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appPath = new URL('../assets/js/app.js', import.meta.url);

test('browser app imports config utilities and RSVP client', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  assert.match(source, /from ['"]\.\/config\.js['"]/);
  assert.match(source, /from ['"]\.\/wedding-utils\.js['"]/);
  assert.match(source, /from ['"]\.\/rsvp-api\.js['"]/);
});

test('browser app wires countdown cover RSVP wishes maps calendar and music', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  for (const token of [
    'open-invitation',
    'countdown-days',
    'calendar-link',
    'maps-link',
    'rsvp-form',
    'wishes-list',
    'music-toggle',
    'background-music'
  ]) {
    assert.match(source, new RegExp(token));
  }
  assert.match(source, /setInterval\([^,]+,\s*15000\)/);
});

test('wishes are created with textContent rather than injected HTML', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  assert.match(source, /textContent\s*=/);
  assert.doesNotMatch(source, /wishesList\.innerHTML\s*=/);
});

test('reveal animations use IntersectionObserver with a safe fallback', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /is-visible/);
});

test('browser app includes a JSONP fallback when normal wishes fetch is blocked', () => {
  const source = fs.readFileSync(appPath, 'utf8');
  assert.match(source, /fetchWishesJsonp/);
});
