---
id: SLAY-1.8
title: 'Public site: brand, metadata, about page, own Vercel project'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
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
- [ ] #1 src/brand/*.svg and public/ icons, favicon, og-image regenerated with tools/brand.ts (Slaydoku wordmark and mystery motif, no gift box); index.html tags English; robots.txt allows crawling; sitemap.xml lists /
- [ ] #2 An About page at /about with the wording above; linked from the start screen; works offline
- [ ] #3 vercel.json keeps the main-only build; a new Vercel project (slaydoku) is created with the vercel CLI and connected to the GitHub repo; a first production deploy is checked with tools/check-share.ts against the deployed URL (all checks pass) and the URL is recorded in the story notes
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1), build and audit:personal pass
<!-- AC:END -->
