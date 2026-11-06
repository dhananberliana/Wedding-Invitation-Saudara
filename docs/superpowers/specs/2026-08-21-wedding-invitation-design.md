# Wedding Invitation Website Design

## Goal
Build a premium, mobile-first digital wedding invitation hosted on GitHub Pages with Google Sheets-backed RSVP submissions, near-real-time wedding wishes, countdown, Maps, Calendar, gifts, music, and uploaded pre-wedding photography.

## Architecture
The site is a static HTML/CSS/JavaScript application suitable for GitHub Pages. Wedding content is centralized in `assets/js/config.js`. RSVP data is sent to a Google Apps Script Web App, which appends one row per submission to the connected Google Sheet and exposes a read-only wishes endpoint.

## Visual direction
Editorial Balinese wedding aesthetic: ivory background, deep charcoal typography, warm bronze/gold accents, generous whitespace, cinematic photography, serif display type, subtle reveal transitions, and restrained ornamental details. Mobile is the primary layout; desktop enhances rather than changes the flow.

## Sections
1. Opening cover with couple image, invitation label, couple names, guest salutation, and Open Invitation CTA.
2. Bride & Groom editorial introduction.
3. Countdown (days, hours, minutes, seconds).
4. Event details with date/time and Save to Google Calendar.
5. Venue section with clickable Google Maps directions.
6. Photo story/gallery using optimized uploaded pre-wedding photos.
7. RSVP form: full name, attendance, guest count, wishes/message.
8. Wedding Wishes feed, refreshed approximately every 15 seconds and immediately updated after successful submission.
9. Gift section titled “Wanna give us some gifts?”.
10. Closing image and thank-you message.
11. Floating music toggle using uploaded background music.

## Data model
Google Sheet tab `RSVP` columns:
- Timestamp
- Full Name
- Attendance
- Guests
- Message
- Submission ID

Apps Script POST validates and appends a row. GET with `action=wishes` returns only public display-safe fields: name, message, timestamp. GET with `action=health` reports service status.

## Configuration
All replaceable wedding content lives in `assets/js/config.js`, including:
- Groom: XXX
- Bride: XXX
- Groom's Father: XXX
- Groom's Mother: XXX
- Venue Address: XXX
- Wedding Date & Time: XXX
- Bank account number: XXX
- Gift delivery address: XXX
- Apps Script Web App URL: XXX

## Resilience and security
- Frontend validates required RSVP fields and guest count.
- Messages are rendered with text nodes, not `innerHTML`, to prevent injected markup.
- RSVP submit button uses a loading state and prevents duplicate rapid submissions.
- Apps Script generates a UUID submission ID server-side.
- Empty messages are stored but excluded from public wishes.
- The wishes endpoint returns only guest name/message/timestamp, never attendance or guest count.
- If the Apps Script URL remains `XXX`, the frontend shows a setup message instead of silently failing.

## Performance
- Selected images are resized and converted to WebP for the website while originals remain untouched.
- Images below the fold use lazy loading and async decoding.
- No framework or heavy dependency is required.
- JavaScript is modular ES modules and CSS uses responsive layout primitives.

## Deployment
GitHub Pages serves the repository root. `.nojekyll` prevents Jekyll processing. Google Apps Script must be deployed as a Web App with execution as the owner and access set so invited guests can submit without signing in.
