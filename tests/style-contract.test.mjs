import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const stylePath = new URL('../assets/css/styles.css', import.meta.url);

test('stylesheet defines the wedding design tokens and mobile-first layout', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  assert.match(css, /:root\s*\{/);
  assert.match(css, /--color-paper:/);
  assert.match(css, /--color-ink:/);
  assert.match(css, /--color-gold:/);
  assert.match(css, /\.section-shell\s*\{/);
});

test('stylesheet includes desktop enhancement and reduced-motion accessibility', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  assert.match(css, /@media\s*\(min-width:\s*768px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('stylesheet keeps floating music control fixed and supports reveal animation', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  assert.match(css, /\.music-toggle\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(css, /\.reveal\s*\{/);
  assert.match(css, /\.reveal\.is-visible\s*\{/);
});
