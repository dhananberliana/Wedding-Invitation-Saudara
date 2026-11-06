# Wedding Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a premium GitHub Pages wedding invitation with RSVP + Google Sheets, public wishes, countdown, Maps, Calendar, gifts, gallery, and music.

**Architecture:** Static HTML/CSS/ES modules on GitHub Pages. A Google Apps Script Web App acts as the only backend, appending RSVP rows to a Google Sheet and serving public wishes JSON.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js built-in test runner, Google Apps Script, Google Sheets, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-21-wedding-invitation-design.md`

## Global Constraints
- Mobile-first and responsive on iPhone and Android browsers.
- No frontend framework or server runtime on GitHub Pages.
- Replaceable wedding values must remain centralized in `assets/js/config.js`.
- RSVP must create one Google Sheet row per successful submission.
- Public wishes must expose only name, message, and timestamp.
- Uploaded media should be optimized for web without modifying originals.

---

### Task 1: Core wedding utilities and configuration
**Files:**
- Create: `package.json`
- Create: `assets/js/config.js`
- Create: `assets/js/wedding-utils.js`
- Test: `tests/wedding-utils.test.mjs`

**Interfaces:**
- Produces `WEDDING_CONFIG`, `getCountdownParts`, `buildGoogleMapsUrl`, `buildGoogleCalendarUrl`, `isConfiguredValue`, and `formatGuestCount`.

- [x] Write failing tests for countdown, Maps URL, Calendar URL, placeholder detection, and guest-count formatting.
- [x] Run `npm test` and verify the missing module/functions cause failure.
- [x] Implement the minimal utilities/configuration.
- [x] Run `npm test` and verify all utility tests pass.

### Task 2: RSVP client behavior
**Files:**
- Create: `assets/js/rsvp-api.js`
- Test: `tests/rsvp-api.test.mjs`

**Interfaces:**
- Consumes `isConfiguredValue` from `wedding-utils.js`.
- Produces `validateRsvp`, `buildRsvpPayload`, `submitRsvp`, and `fetchWishes`.

- [x] Write failing tests for validation, payload normalization, and unconfigured endpoint rejection.
- [x] Run `npm test` and verify failure for missing RSVP module.
- [x] Implement minimal RSVP client behavior.
- [x] Run `npm test` and verify RSVP tests pass.

### Task 3: Google Apps Script backend
**Files:**
- Create: `apps-script/Code.gs`
- Create: `apps-script/appsscript.json`
- Test: `tests/apps-script-contract.test.mjs`

**Interfaces:**
- POST fields: `fullName`, `attendance`, `guests`, `message`.
- GET `action=wishes` returns `{ok:true,wishes:[{name,message,timestamp}]}`.
- GET `action=health` returns `{ok:true,service:'wedding-rsvp'}`.

- [x] Write failing source-contract tests for required handlers, sheet name, UUID, appendRow, and public field mapping.
- [x] Run `npm test` and verify backend contract test fails.
- [x] Implement Apps Script backend with validation and JSON responses.
- [x] Run `npm test` and verify backend contract test passes.

### Task 4: Wedding page structure and accessibility
**Files:**
- Create: `index.html`
- Test: `tests/page-contract.test.mjs`

**Interfaces:**
- DOM IDs used by `app.js`: `opening-cover`, `open-invitation`, `countdown`, `calendar-link`, `maps-link`, `rsvp-form`, `wishes-list`, `music-toggle`, `background-music`.

- [x] Write failing page contract test for required sections, labels, form fields, CTA targets, and music controls.
- [x] Run `npm test` and verify page contract fails before page creation.
- [x] Implement semantic HTML page structure.
- [x] Run `npm test` and verify page contract passes.

### Task 5: Premium responsive styling
**Files:**
- Create: `assets/css/styles.css`
- Test: `tests/style-contract.test.mjs`

**Interfaces:**
- CSS custom properties define palette and spacing.
- Responsive breakpoint enhances layout at `min-width: 768px`.

- [x] Write failing style contract test for mobile-first rules, responsive breakpoint, reduced-motion support, and fixed music button.
- [x] Run `npm test` and verify style contract fails.
- [x] Implement the premium editorial visual system.
- [x] Run `npm test` and verify style contract passes.

### Task 6: Browser application wiring
**Files:**
- Create: `assets/js/app.js`
- Test: `tests/app-contract.test.mjs`

**Interfaces:**
- Reads `WEDDING_CONFIG`, writes config content into `[data-config]` elements, starts countdown, wires Calendar/Maps links, handles invitation cover, submits RSVP, polls wishes, and toggles music.

- [x] Write failing app contract tests for imports and required behavior hooks.
- [x] Run `npm test` and verify app contract fails.
- [x] Implement browser wiring with safe text rendering and loading/error states.
- [x] Run `npm test` and verify app contract passes.

### Task 7: Web media optimization
**Files:**
- Create: `assets/images/hero.webp`
- Create: `assets/images/couple-editorial.webp`
- Create: `assets/images/story-01.webp`
- Create: `assets/images/story-02.webp`
- Create: `assets/images/story-03.webp`
- Create: `assets/images/closing.webp`
- Create: `assets/audio/bermuara.mp3`

- [x] Select uploaded images based on composition and section suitability.
- [x] Resize and convert selected images to WebP with sensible long-edge limits and quality.
- [x] Copy the uploaded MP3 into the project audio folder.
- [x] Verify every referenced media file exists and image dimensions are mobile-web appropriate.

### Task 8: Documentation and GitHub Pages readiness
**Files:**
- Create: `.nojekyll`
- Create: `.gitignore`
- Create: `README.md`

- [x] Document config replacement, Apps Script binding/deploy steps, Google Sheet structure, local preview, GitHub Pages deployment, and maintenance.
- [x] Include the exact spreadsheet ID and URL created for this project.
- [x] Run all tests.
- [x] Run a local static server smoke check and validate key asset HTTP responses.
- [x] Package the verified project for handoff/publishing.
