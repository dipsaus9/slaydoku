---
id: SLAY-14.7
title: 'Push Worker deploy config, VAPID key tool and setup docs'
status: Done
assignee: []
created_date: '2026-10-02 09:55'
updated_date: '2026-10-02 13:09'
labels:
  - story
dependencies:
  - SLAY-14.6
references:
  - workers/push/wrangler.toml
  - tools/vapid.ts
  - tools/vapid.test.ts
  - docs/push.md
  - CLAUDE.md
parent_task_id: SLAY-14
type: chore
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the owner can deploy the Worker in minutes: wrangler config, a VAPID key generator, and docs/push.md with the manual steps (the owner already has a free Cloudflare account). CLAUDE.md records push as the one server-side exception.
Type: deliverable
Branch: SLAY-14.7/push-deploy-docs
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 workers/push/wrangler.toml defines the KV binding, an hourly cron trigger and the VAPID secrets as variables (no secret values committed)
- [x] #2 bun tools/vapid.ts prints a fresh VAPID public/private key pair in the format the Worker and the client expect
- [x] #3 docs/push.md lists the exact steps: wrangler login, KV namespace create, secret put, deploy, where to paste the public key and Worker URL in the app, and how to check logs; it also states the free-tier limits and the privacy footprint
- [x] #4 CLAUDE.md decisions state that push reminders are the one server-side exception to device-only data, storing only endpoint/keys/hour
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass, no findings. Added tools/vapid.test.ts to References.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added workers/push/wrangler.toml (SUBSCRIPTIONS KV binding, */5 cron, secrets documented not stored), tools/vapid.ts plus test (key pair in the Worker's format, verified with Worker signing), docs/push.md (deploy steps, where to paste values, limits, privacy) and the CLAUDE.md push exception sentence.
<!-- SECTION:FINAL_SUMMARY:END -->
