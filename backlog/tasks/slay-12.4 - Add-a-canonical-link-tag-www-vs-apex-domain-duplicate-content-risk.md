---
id: SLAY-12.4
title: Add a canonical link tag (www vs apex domain duplicate-content risk)
status: Done
assignee: []
created_date: '2026-09-29 17:45'
updated_date: '2026-09-29 18:48'
labels:
  - story
dependencies: []
references:
  - index.html
  - src/brand/site.ts
  - src/brand/site.test.ts
  - tools/check-share.ts
  - tools/check-share.test.ts
  - src/ui/canonical/
  - src/main.tsx
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
- [x] #1 index.html declares <link rel="canonical" href="..."> for each route the sitemap lists (/ and /about), resolved to an absolute URL at build time the same way og:url already is
- [x] #2 The canonical URL is consistent with og:url (same host — don't introduce a second disagreement between the two)
- [x] #3 bun tools/check-share.ts still passes, extended with a canonical-tag check (absolute URL, matches the page's own path)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Confirmed via investigation: this is a single-file SPA (vercel.json rewrites every path to the one built index.html; tools/check-share.test.ts:490-492 explicitly asserts and documents that the head is static/identical across every route, including og:url staying on root for /about and /play). A truly per-route canonical href would require a multi-page build + routing change, well beyond "the same way og:url already is" and directly against a deliberately-tested invariant.

Implementation: add a single static canonical link tag, resolved absolute at build time the same way og:url/og:image/twitter:image already are (mirrors the existing architecture, same value on every route). This fully resolves the stated Outcome (www vs apex duplicate-content risk).

1. index.html: add <link rel="canonical" href="/" /> near the og:url comment; extend that comment to mention it.
2. src/brand/site.ts: add ABSOLUTE_LINKS (rel-keyed) alongside ABSOLUTE_META; extend injectSiteUrls to rewrite canonical href absolute; extend findHtmlProblems to fail the build if canonical is missing or not absolute.
3. tools/check-share.ts: add parseCanonicalHref (mirrors parseManifestHref), and new checks in checkShare: canonical link present, absolute, same host as og:url (AC2), and matches the fetched page's own path (AC3) -- holds for the real usage (checked against the site root).
4. tools/check-share.test.ts: extend the golden head() fixture with a matching canonical tag, add failure-mode tests (missing, relative, wrong host, wrong path).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: a single static canonical link (mirroring how og:url is already handled), resolved absolute at build time by siteMetaPlugin. This is a deliberate interpretation of AC1/AC3, documented because the codebase's own tested invariant (tools/check-share.test.ts: 'keeps og:url on the root URL for every route: the head is static') establishes that index.html is served byte-identical for every route (a single-file SPA, vercel.json rewrites everything to it) -- a truly per-route canonical would require a multi-page build, well beyond 'the same way og:url already is' and against that tested invariant. The static canonical fully resolves the stated Outcome (www vs apex duplicate-content risk): og:url and canonical now agree and are consistent for every host that serves this build. check-share.ts gained 4 new checks (present, absolute, same host as og:url, matches the fetched page's own path); verified against a real localhost:4173 preview build, all 66 checks pass.

Review round 1 blocked on: (a) AC1 not genuinely satisfied by a single static canonical, since /about's canonical pointed at the homepage instead of self-referencing -- fixed by adding a client-side installCanonicalLink (src/ui/canonical/, mirroring installScreenTitles) that corrects the canonical href per route once JS runs, since the server always sends the same static index.html for every route; (b) src/brand/site.test.ts and tools/check-share.test.ts changed but weren't in References -- widened References to cover them plus the new src/ui/canonical/ module and src/main.tsx (which now wires installCanonicalLink() in alongside installScreenTitles()).

Review round 1: block (AC1 not met -- static canonical pointed /about at the homepage; scope violations on src/brand/site.test.ts and tools/check-share.test.ts). Fixed with a client-side installCanonicalLink (src/ui/canonical/) and a References widen. Review round 2: pass, no blocking findings, no scope violations. Two advisory findings both accepted as documented trade-offs: (1) AC1's 'at build time' is literally true only for the root value -- /about's self-reference is corrected client-side once JS runs, not baked into the static HTML; Google's crawler executes JS and will see it, but a non-JS fetch (including check-share.ts's own) never will. A true build-time per-route canonical would need a multi-page build, out of this story's scope. (2) check-share.ts's new path-match check only ever exercises the root URL in real usage; a regression to /about's client-side correction would only be caught by src/ui/canonical/canonical.test.ts's unit tests, not check-share.ts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a canonical link tag to fix the www vs apex duplicate-content risk (slaydoku.nl and www.slaydoku.nl both alias the same production deployment). Two parts, after a review round that caught a real gap in the first cut: (1) index.html declares <link rel="canonical" href="/" />, resolved absolute at build time by siteMetaPlugin (src/brand/site.ts, generalized with a new ABSOLUTE_LINKS list alongside the existing ABSOLUTE_META) the same way og:url/og:image/twitter:image already are, with the build failing if it's missing or relative -- this is the root-level, same-host-as-og:url fix AC1/AC2 ask for. (2) Because this SPA serves one static index.html for every route (vercel.json rewrites everything to it -- a tested invariant in check-share.test.ts), a build-time-only canonical can't genuinely self-reference /about; a client-side installCanonicalLink (src/ui/canonical/, mirroring the existing installScreenTitles per-route document.title pattern) corrects the canonical href to the current route once JS runs, verified live in a real browser against a local preview build. tools/check-share.ts gained a canonical check (present, absolute, same host as og:url, matches the fetched page's own path) plus a parseCanonicalHref parser. Full suite green: 142 test files / 3041 tests, lint, typecheck, build, and an end-to-end bun tools/check-share.ts run against a local preview (66/66 checks). Independent review passed on round 2 with two accepted advisory trade-offs (see notes): the client-side correction isn't observable by a non-JS fetch (real crawlers execute JS; check-share.ts's own static fetch can't), and check-share.ts's path-match check only exercises the root, not /about -- both accepted as reasonable given the SPA's single-index.html architecture, with a multi-page build flagged as the only way to remove them entirely.
<!-- SECTION:FINAL_SUMMARY:END -->
