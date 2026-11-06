# Premium Wedding Invitation

A mobile-first digital wedding invitation built for GitHub Pages, with Google Sheets RSVP storage, near-real-time wedding wishes, countdown, Google Maps, Google Calendar, gifts, pre-wedding photography, and background music.

## Project Status

The frontend and Google Apps Script backend are production-ready. The remaining account-level steps are:

1. Replace wedding placeholders in `assets/js/config.js`.
2. Deploy `apps-script/Code.gs` as a Google Apps Script Web App and paste the `/exec` URL into `assets/js/config.js`.
3. Publish this repository with GitHub Pages.

## Folder Structure

```text
wedding-invitation/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── config.js
│   │   ├── rsvp-api.js
│   │   └── wedding-utils.js
│   ├── images/
│   │   ├── hero.webp
│   │   ├── couple-editorial.webp
│   │   ├── story-01.webp
│   │   ├── story-02.webp
│   │   ├── story-03.webp
│   │   └── closing.webp
│   └── audio/bermuara.mp3
├── apps-script/
│   ├── Code.gs
│   └── appsscript.json
├── tests/
├── docs/superpowers/
├── .nojekyll
└── package.json
```

## 1. Edit Wedding Information

Open `assets/js/config.js`. All content that normally changes between wedding clients is centralized there.

Replace these values:

```js
couple: {
  groom: 'XXX',
  bride: 'XXX',
  groomFather: 'XXX',
  groomMother: 'XXX'
},
event: {
  title: 'The Wedding of XXX & XXX',
  displayDateTime: 'XXX',
  start: 'XXX',
  end: 'XXX',
  venueAddress: 'XXX',
  description: 'With joyful hearts, we invite you to celebrate our wedding day.'
},
gift: {
  bankAccount: 'XXX',
  deliveryAddress: 'XXX'
},
integration: {
  appsScriptUrl: 'XXX'
}
```

Use ISO 8601 date/time for `start` and `end`. For Bali/WITA, for example:

```js
start: '2027-01-19T10:00:00+08:00',
end: '2027-01-19T13:00:00+08:00'
```

`displayDateTime` is the human-readable text shown to guests, for example `19 January 2027 · 10:00 WITA`.

## 2. Google Sheets RSVP Database

A Google Sheet has already been created for this project:

- File: **Wedding Invitation RSVP**
- Spreadsheet ID: `1mPhLCLAT__FFkMhQXwPmT9PgyXM5Tb-_mgxlQRKd4lU`
- Sheet tab: `RSVP`
- Time zone: `Asia/Makassar`

Columns:

| Column | Field |
| --- | --- |
| A | Timestamp |
| B | Full Name |
| C | Attendance |
| D | Guests |
| E | Message |
| F | Submission ID |

Each successful RSVP creates one new row. The website's public wishes feed returns only the guest name, message, and timestamp; attendance and guest count are not exposed in the public feed.

## 3. Deploy Google Apps Script

The backend code is in `apps-script/Code.gs` and already contains the correct Spreadsheet ID.

### Setup

1. Open the **Wedding Invitation RSVP** Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Replace the default `Code.gs` content with the content from `apps-script/Code.gs`.
4. Save the project.
5. Select **Deploy → New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to **Me**.
8. Set **Who has access** to **Anyone** so wedding guests do not need to sign in.
9. Click **Deploy** and complete Google's authorization prompt.
10. Copy the deployment URL ending in `/exec`.
11. Paste it into `assets/js/config.js`:

```js
integration: {
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
}
```

### Backend health check

Open this URL in a browser after deployment:

```text
YOUR_APPS_SCRIPT_URL?action=health
```

Expected response:

```json
{"ok":true,"service":"wedding-rsvp"}
```

The public wishes endpoint is:

```text
YOUR_APPS_SCRIPT_URL?action=wishes
```

Google Apps Script Content Service redirects responses to `script.googleusercontent.com`; normal browser requests follow this redirect automatically.

## 4. RSVP Flow

When a guest submits the form:

1. Browser validates Full Name and Attendance.
2. The frontend normalizes guest count.
3. Data is sent as URL-encoded form fields to the Apps Script Web App using a `no-cors` request compatible with static GitHub Pages hosting.
4. Apps Script validates the payload again.
5. Apps Script obtains a script lock to avoid overlapping row writes.
6. A UUID is generated as the Submission ID.
7. A new row is appended to the `RSVP` sheet.
8. The frontend refreshes the Wedding Wishes list immediately.
9. The page checks for new wishes every 15 seconds. If a browser blocks cross-origin JSON fetches from Apps Script, the client automatically retries the read-only wishes request with a sanitized JSONP callback.

## 5. Google Calendar & Maps

No API key is required.

- The venue button generates a Google Maps search link from `event.venueAddress`.
- The Save the Date button generates a Google Calendar event from the title, start time, end time, venue, and description in `config.js`.

## 6. Media Maintenance

The current website uses optimized WebP versions of the uploaded pre-wedding photography and the uploaded `Bermuara - Mahalini` MP3.

To replace a photo without changing HTML, overwrite the matching file name:

- `assets/images/hero.webp`
- `assets/images/couple-editorial.webp`
- `assets/images/story-01.webp`
- `assets/images/story-02.webp`
- `assets/images/story-03.webp`
- `assets/images/closing.webp`

Recommended image targets:

- WebP format
- 1,600–2,200 px on the longest edge
- Roughly 80–85 quality
- Keep each image preferably below 300 KB when practical

For music, replace `assets/audio/bermuara.mp3` with another MP3 using the same filename, or update the path in `index.html`.

## 7. Local Preview

Run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Automated contract tests:

```bash
npm test
```

## 8. Deploy to GitHub Pages

After the files are pushed to your GitHub repository:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the publishing branch (normally `main`).
5. Select folder **/(root)**.
6. Click **Save**.
7. Wait for GitHub Pages deployment to finish.

The file `.nojekyll` is included so GitHub serves the project as a plain static site.

## 9. Maintenance Checklist

Before sending the invitation link to guests:

- Replace every `XXX` value in `assets/js/config.js`.
- Set a valid `start` and `end` ISO date/time.
- Confirm the Maps button opens the correct venue.
- Confirm Save to Google Calendar shows the correct title/date/time/location.
- Deploy Apps Script and add the `/exec` URL to `config.js`.
- Submit one test RSVP and verify a row appears in Google Sheets.
- Confirm the test message appears in Wedding Wishes.
- Test on at least one iPhone and one Android browser.
- Confirm the background music starts after the guest taps **Open Invitation**.
- Confirm GitHub Pages serves all images, CSS, JS, and audio over HTTPS.

## Security & Privacy Notes

- Do not put private API keys in this repository. This project does not require one.
- The public wishes endpoint intentionally exposes only guest name, message, and timestamp.
- Google Sheet edit access should remain private to the wedding organizer.
- Anyone who has the invitation page can submit the RSVP form once the Web App is public, so keep the invitation URL limited to intended guests where practical.
