---
id: SLAY-14.7
title: 'Push Worker deploy config, VAPID key tool and setup docs'
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
labels:
  - story
dependencies:
  - SLAY-14.6
references:
  - workers/push/wrangler.toml
  - tools/vapid.ts
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
- [ ] #1 workers/push/wrangler.toml defines the KV binding, an hourly cron trigger and the VAPID secrets as variables (no secret values committed)
- [ ] #2 bun tools/vapid.ts prints a fresh VAPID public/private key pair in the format the Worker and the client expect
- [ ] #3 docs/push.md lists the exact steps: wrangler login, KV namespace create, secret put, deploy, where to paste the public key and Worker URL in the app, and how to check logs; it also states the free-tier limits and the privacy footprint
- [ ] #4 CLAUDE.md decisions state that push reminders are the one server-side exception to device-only data, storing only endpoint/keys/hour
<!-- AC:END -->
