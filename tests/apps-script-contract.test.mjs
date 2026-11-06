import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sourcePath = new URL('../apps-script/Code.gs', import.meta.url);

test('Apps Script backend exposes GET and POST handlers with RSVP sheet contract', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.match(source, /function\s+doGet\s*\(/);
  assert.match(source, /function\s+doPost\s*\(/);
  assert.match(source, /SHEET_NAME:\s*['"]RSVP['"]/);
  assert.match(source, /SpreadsheetApp\.openById/);
  assert.match(source, /appendRow\s*\(/);
  assert.match(source, /Utilities\.getUuid\s*\(/);
});

test('Apps Script public wishes response maps only public fields', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.match(source, /name:\s*row\[1\]/);
  assert.match(source, /message:\s*row\[4\]/);
  assert.match(source, /timestamp:/);
  assert.doesNotMatch(source, /wishes\.push\([^)]*attendance/s);
});

test('Apps Script supports health and wishes actions', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.match(source, /action\s*===\s*['"]wishes['"]/);
  assert.match(source, /service:\s*['"]wedding-rsvp['"]/);
});

test('Apps Script offers JSONP for the read-only wishes endpoint', () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  assert.match(source, /parameter\.prefix/);
  assert.match(source, /MimeType\.JAVASCRIPT/);
  assert.match(source, /sanitizeCallback_/);
});
