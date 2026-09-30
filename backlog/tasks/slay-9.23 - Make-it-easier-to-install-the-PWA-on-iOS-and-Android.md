---
id: SLAY-9.23
title: Make it easier to install the PWA on iOS and Android
status: In Progress
assignee: []
created_date: '2026-09-30 09:58'
updated_date: '2026-09-30 11:05'
labels:
  - story
dependencies: []
references:
  - src/pwa/index.ts
  - src/pwa/strings.ts
  - src/pwa/pwa.css
  - src/main.tsx
  - src/validation/dutch.test.ts
parent_task_id: SLAY-9
type: feature
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a dismissible, unobtrusive install prompt helps players add Slaydoku to their home screen, tailored to what each platform actually supports.
Type: deliverable
Branch: SLAY-9.23/pwa-install-prompt

Confirmed nothing like this exists today: no beforeinstallprompt handling anywhere in the codebase, src/pwa/ only handles service-worker registration, caching and the update-available notice (UpdateNotice.tsx). The manifest itself is already correct (confirmed via bun tools/check-share.ts) — this is purely about the in-app installability UX, not manifest/service-worker plumbing.

Platform reality, since the two are fundamentally different and both need their own path, not a shared generic prompt:
- Android/Chrome (and other Chromium browsers): supports the beforeinstallprompt event — capture it, show a custom 'Install Slaydoku' banner/button, call .prompt() on click. This is the only platform where a one-tap programmatic install actually exists.
- iOS Safari: NO programmatic install API exists at all, not now, not ever realistically — the only path is the user manually tapping Share → 'Add to Home Screen'. The only thing achievable here is a clear instructional banner explaining those exact steps, shown at an appropriate moment.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On Android/Chromium browsers that fire beforeinstallprompt, a dismissible banner/button appears offering a one-tap install, using the native prompt (not a fake/misleading button)
- [x] #2 On iOS Safari, a dismissible banner explains the manual 'Share → Add to Home Screen' steps, since no programmatic install exists there
- [x] #3 Neither banner shows to a player already running the installed app (display-mode: standalone on Android, navigator.standalone on iOS) or on a browser/platform that supports neither path (e.g. desktop, Firefox)
- [x] #4 Dismissing a banner doesn't bring it back every single visit — remember the dismissal (localStorage), reasonable to resurface after a while rather than never again
- [x] #5 Both banners are localized (en/nl), match the existing UpdateNotice.tsx's quiet visual weight (not a full-screen interstitial), and are verified against the actual rendered screen on both platforms (iOS Safari and Android Chrome simulation), per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Mirror UpdateNotice.tsx's pattern (a small subscribable store + a quiet top-of-page notice component) for a new InstallNotice: one hook detecting platform + install-availability + dismissal state, feeding two small notice variants (Android native-prompt banner, iOS instructional banner). Mount alongside the existing <UpdateNotice/> in main.tsx.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as src/pwa/install.ts (pure/testable: platform + standalone detection, dismissal persistence with a 30-day resurface window, createInstallStore mirroring updater.ts's createUpdater pattern), src/pwa/installRegister.ts (real-browser wiring: window/navigator/matchMedia/localStorage, mirrors register.ts), src/pwa/InstallNotice.tsx (mirrors UpdateNotice.tsx), plus INSTALL_EN/INSTALL_NL in strings.ts and .install-notice CSS in pwa.css matching .update-notice's box exactly. Mounted in main.tsx alongside <UpdateNotice/>.

Widened References to include src/validation/dutch.test.ts: adding INSTALL_NL required adding it to that file's NL_EXCEPTIONS map (one line) or the existing Dutch-text guard test fails on the new Dutch strings, same pattern as the SLAY-3.4/3.5/9.7 precedents already in that file.

Rendered-screen verification (headless Chrome via CDP, throwaway script, not committed): Android banner appears (including a REAL native beforeinstallprompt firing on its own before any synthetic dispatch, confirming this build is genuinely installable and the listener wiring works against the real browser API), Install button calls the captured event's own .prompt(), banner is consumed after use, dismiss hides it and persists to localStorage, and a dismissed banner stays hidden on the next visit. iOS Safari banner (UA override) shows the instructional text with no install button, in both en and nl. navigator.standalone=true suppresses both banners. Not exercised live: CDP's Emulation.setEmulatedMedia display-mode override does not flip matchMedia() in this Chrome build (verified separately on a plain page too) so the Android display-mode:standalone suppression path, and the "neither platform" (Firefox) case, rely on install.test.ts's deterministic unit coverage instead (isStandaloneDisplay, createInstallStore's standalone/no-event branches).

Baseline verify green: lint, typecheck, full test suite (144 files / 3085 tests), production build.
<!-- SECTION:NOTES:END -->
