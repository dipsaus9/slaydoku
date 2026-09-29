---
id: SLAY-12.4
title: Add a canonical link tag (www vs apex domain duplicate-content risk)
status: To Do
assignee: []
created_date: '2026-09-29 17:45'
labels:
  - story
dependencies: []
references:
  - index.html
  - src/brand/site.ts
  - tools/check-share.ts
parent_task_id: SLAY-12
type: feature
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the site declares an explicit canonical URL, so Google doesn't risk indexing slaydoku.nl and www.slaydoku.nl as separate near-duplicate pages.
Type: deliverable
Branch: SLAY-12.4/canonical-link-tag

Found while checking Search Console setup: no <link rel="canonical"> tag exists anywhere (confirmed: no match in index.html or src/brand/*.ts). og:url already resolves to the absolute production URL via siteMetaPlugin (src/brand/site.ts's resolveSiteUrl()/injectSiteUrls(), using VERCEL_PROJECT_PRODUCTION_URL) and currently points at https://www.slaydoku.nl/ per a live check-share run — both slaydoku.nl and www.slaydoku.nl alias the same production deployment (docs/handoff.md), so without a canonical tag there's a small duplicate-content risk. Low risk in practice since Search Console was verified as a Domain property (covers all subdomains/protocols as one property), but still the technically-correct fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 index.html declares <link rel="canonical" href="..."> for each route the sitemap lists (/ and /about), resolved to an absolute URL at build time the same way og:url already is
- [ ] #2 The canonical URL is consistent with og:url (same host — don't introduce a second disagreement between the two)
- [ ] #3 bun tools/check-share.ts still passes, extended with a canonical-tag check (absolute URL, matches the page's own path)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a <link rel="canonical" href="/" /> placeholder in index.html near the existing og:url comment; extend siteMetaPlugin's injectSiteUrls() (or a small sibling function) to rewrite it to an absolute URL the same way ABSOLUTE_META does for og:url/og:image/twitter:image. Add the matching check to check-share.ts.
<!-- SECTION:PLAN:END -->
