---
id: SLAY-9.23
title: Make it easier to install the PWA on iOS and Android
status: Done
assignee: []
created_date: '2026-09-30 09:58'
updated_date: '2026-09-30 11:09'
labels:
  - story
dependencies: []
references:
  - src/pwa/index.ts
  - src/pwa/strings.ts
  - src/pwa/pwa.css
  - src/main.tsx
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
- [ ] #1 On Android/Chromium browsers that fire beforeinstallprompt, a dismissible banner/button appears offering a one-tap install, using the native prompt (not a fake/misleading button)
- [ ] #2 On iOS Safari, a dismissible banner explains the manual 'Share → Add to Home Screen' steps, since no programmatic install exists there
- [ ] #3 Neither banner shows to a player already running the installed app (display-mode: standalone on Android, navigator.standalone on iOS) or on a browser/platform that supports neither path (e.g. desktop, Firefox)
- [ ] #4 Dismissing a banner doesn't bring it back every single visit — remember the dismissal (localStorage), reasonable to resurface after a while rather than never again
- [ ] #5 Both banners are localized (en/nl), match the existing UpdateNotice.tsx's quiet visual weight (not a full-screen interstitial), and are verified against the actual rendered screen on both platforms (iOS Safari and Android Chrome simulation), per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Mirror UpdateNotice.tsx's pattern (a small subscribable store + a quiet top-of-page notice component) for a new InstallNotice: one hook detecting platform + install-availability + dismissal state, feeding two small notice variants (Android native-prompt banner, iOS instructional banner). Mount alongside the existing <UpdateNotice/> in main.tsx.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent review (dipsaus-ai:story-reviewer): round 1 blocked only on scopeViolations for 5 new files (install.ts, install.test.ts, installRegister.ts, InstallNotice.tsx, InstallNotice.test.tsx) not yet in References, with all 5 acceptance criteria already judged met. Widened References to include them. Round 2 verdict: pass — all 5 acceptance criteria met, no scope violations, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Android/Chromium and iOS Safari home-screen install banners, mirroring UpdateNotice.tsx's small-store + quiet-notice pattern. Android captures beforeinstallprompt and offers a real one-tap .prompt(); iOS Safari gets an instructional Share -> Add to Home Screen banner (no programmatic install exists there). Neither shows once standalone (display-mode or navigator.standalone) or on a browser that never fires the event. Dismissal persists to localStorage with a 30-day resurface window. Both banners are localized (en/nl) and CSS-matched to UpdateNotice's visual weight. Verified in headless Chrome via CDP: the Android banner (including a real native beforeinstallprompt firing on its own), the Install button replaying the captured event's .prompt(), dismiss-then-reload persistence, the iOS Safari banner in en/nl, and navigator.standalone suppression. The display-mode:standalone CDP media-feature override did not take effect in this Chrome build, so that suppression path and the desktop/Firefox 'neither path' case rely on install.test.ts's deterministic coverage instead. Independent review passed on round 2 (round 1 blocked only on References scope, since fixed).
<!-- SECTION:FINAL_SUMMARY:END -->
