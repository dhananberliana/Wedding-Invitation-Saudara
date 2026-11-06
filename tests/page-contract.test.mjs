import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../index.html', import.meta.url);

test('page contains all required wedding invitation sections', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  for (const id of ['opening-cover', 'couple', 'countdown', 'event-details', 'venue', 'rsvp', 'wishes', 'gift', 'closing']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('RSVP form includes all required guest fields', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /id=["']rsvp-form["']/);
  assert.match(html, /name=["']fullName["']/);
  assert.match(html, /name=["']attendance["']/);
  assert.match(html, /name=["']guests["']/);
  assert.match(html, /name=["']message["']/);
  assert.match(html, /value=["']attending["']/);
  assert.match(html, /value=["']not-attending["']/);
});

test('page provides Google Calendar Maps wishes and music hooks', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /id=["']calendar-link["']/);
  assert.match(html, /id=["']maps-link["']/);
  assert.match(html, /id=["']wishes-list["']/);
  assert.match(html, /id=["']music-toggle["']/);
  assert.match(html, /id=["']background-music["']/);
  assert.match(html, /id=["']open-invitation["']/);
});

test('page references optimized web media and the browser app module', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /assets\/images\/hero\.webp/);
  assert.match(html, /assets\/audio\/bermuara\.mp3/);
  assert.match(html, /type=["']module["][^>]+assets\/js\/app\.js/);
});
