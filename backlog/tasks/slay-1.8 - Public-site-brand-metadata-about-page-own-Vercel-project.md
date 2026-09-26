---
id: SLAY-1.8
title: 'Public site: brand, metadata, about page, own Vercel project'
status: In Progress
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 23:04'
labels:
  - story
dependencies:
  - SLAY-1.2
references:
  - src/brand/
  - public/
  - index.html
  - vercel.json
  - src/ui/about/
  - tools/brand.ts
  - tools/check-share.ts
  - tools/check-share.test.ts
  - tools/indexing.ts
  - src/App.tsx
  - src/ui/levels/
  - src/ui/title/
  - src/pwa/
  - vite.config.ts
  - package.json
  - README.md
  - docs/launch.md
  - docs/verification/offline.ts
parent_task_id: SLAY-1
type: feature
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the site looks like a product: own logo and favicon (a murder-mystery motif, not the placeholder gift box), share preview image and tags for the site, manifest name, robots and sitemap (indexable, unlike the prototype), an About page (how it works, credit "inspired by Murdoku by Manuel Garand", privacy: nothing leaves your device, no accounts), and a NEW Vercel project connected to the repo with production on main only. The repo stays private until the owner says go.
Type: deliverable
Branch: SLAY-1.8/public-site
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/brand/*.svg and public/ icons, favicon, og-image regenerated with tools/brand.ts (Slaydoku wordmark and mystery motif, no gift box); index.html tags English; robots.txt allows crawling; sitemap.xml lists /
- [x] #2 An About page at /about with the wording above; linked from the start screen; works offline
- [ ] #3 vercel.json keeps the main-only build; a new Vercel project (slaydoku) is created with the vercel CLI and connected to the GitHub repo; a first production deploy is checked with tools/check-share.ts against the deployed URL (all checks pass) and the URL is recorded in the story notes
- [x] #4 bun run lint/typecheck/test (--maxWorkers=1), build and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Brand art + brand.ts regenerate; site tags; About page at /about (route in App, footer link, title, offline shell); indexing switch (src/brand/site.json + tools/indexing.ts, generated robots.txt/sitemap.xml/meta, vercel.json header); check-share modes; Vercel project via CLI; README + docs/launch.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Vercel: project slaydoku created with the vercel CLI in the owner's personal scope and linked. GitHub connection FAILED: 'vercel git connect' on the repo says 'Failed to connect ... Make sure there aren't any typos and that you have access to the repository if it's private' (Vercel GitHub app has no access to the private repo). Owner must: GitHub, Settings, Applications, Vercel, Configure, add repository slaydoku to the selected repositories, then Vercel project slaydoku, Settings, Git, Connect Git Repository (production branch main). Not worked around. Deploy: 'vercel deploy' from the branch; because the project had no production deployment yet, Vercel made it the production deployment: https://slaydoku.vercel.app (unique URL slaydoku-2y2ilzpxh-<scope>.vercel.app). No deployment protection (200, public but noindex). bun tools/check-share.ts https://slaydoku.vercel.app (mode noindex from src/brand/site.json): all 65 checks passed. Custom domain: none. Indexing: default noindex; flip with 'bun tools/indexing.ts on' (see docs/launch.md); indexable mode also verified locally with vite preview: 63 checks passed. AC1 note: robots.txt intentionally disallows (noindex mode, owner decision) and sitemap.xml is generated only in indexable mode; both verified. Offline verification docs/verification/offline.ts: 30 checks passed incl. /about.

Review gate round 1 (story-reviewer): verdict block, only on AC3 (GitHub connection missing = owner action, see notes above and docs/launch.md). AC1, AC2, AC4 met, no scope violations. Advisory: Contact placeholder on About page must be replaced before go-public (SLAY-1.10); check-share fixture alt text fixed. Story left In Progress, AC3 unchecked, until the owner connects the repo in Vercel and 'vercel deploy --prod' / a push to main is checked with tools/check-share.ts.
<!-- SECTION:NOTES:END -->
