const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1mPhLCLAT__FFkMhQXwPmT9PgyXM5Tb-_mgxlQRKd4lU',
  SHEET_NAME: 'RSVP',
  MAX_WISHES: 100,
  MAX_MESSAGE_LENGTH: 1000
});

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'health').toLowerCase();
  const prefix = sanitizeCallback_(e && e.parameter && e.parameter.prefix);

  if (action === 'wishes') {
    const payload = { ok: true, wishes: getWishes_() };
    return prefix ? javascript_(prefix, payload) : json_(payload);
  }

  return json_({ ok: true, service: 'wedding-rsvp' });
}

function doPost(e) {
  try {
    const input = normalizeSubmission_((e && e.parameter) || {});
    const validationError = validateSubmission_(input);
    if (validationError) {
      return json_({ ok: false, error: validationError });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getSheet_();
      const submissionId = Utilities.getUuid();
      sheet.appendRow([
        new Date(),
        input.fullName,
        input.attendance === 'attending' ? 'Attending' : 'Not Attending',
        input.guests,
        input.message,
        submissionId
      ]);
      SpreadsheetApp.flush();
      return json_({ ok: true, submissionId: submissionId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: 'Unable to save RSVP right now. Please try again.' });
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }

  const headers = ['Timestamp', 'Full Name', 'Attendance', 'Guests', 'Message', 'Submission ID'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (currentHeaders.join('|') !== headers.join('|')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

function getWishes_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return rows
    .filter(function(row) {
      return String(row[4] || '').trim().length > 0;
    })
    .reverse()
    .slice(0, CONFIG.MAX_WISHES)
    .map(function(row) {
      const timestamp = row[0] instanceof Date ? row[0].toISOString() : String(row[0] || '');
      return {
        name: row[1],
        message: row[4],
        timestamp: timestamp
      };
    });
}

function normalizeSubmission_(params) {
  const attendance = String(params.attendance || '').trim().toLowerCase();
  let guests = parseInt(params.guests, 10);
  if (!Number.isFinite(guests)) guests = 1;

  if (attendance !== 'attending') {
    guests = 0;
  } else {
    guests = Math.max(1, Math.min(10, guests));
  }

  return {
    fullName: String(params.fullName || '').trim().slice(0, 120),
    attendance: attendance,
    guests: guests,
    message: String(params.message || '').trim().slice(0, CONFIG.MAX_MESSAGE_LENGTH)
  };
}

function validateSubmission_(input) {
  if (!input.fullName) return 'Full name is required.';
  if (['attending', 'not-attending'].indexOf(input.attendance) === -1) {
    return 'Attendance confirmation is required.';
  }
  return '';
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}


function sanitizeCallback_(value) {
  const callback = String(value || '').trim();
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback) ? callback : '';
}

function javascript_(prefix, payload) {
  return ContentService
    .createTextOutput(prefix + '(' + JSON.stringify(payload) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
