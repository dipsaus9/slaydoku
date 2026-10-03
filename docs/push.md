# Push reminders: deploy the Worker

Daily reminders run on one small Cloudflare Worker (`workers/push/`). It stores the subscriptions
and, on a cron, sends a payload-less Web Push at the hour each player chose (Amsterdam time). Until
you do the steps below the app shows reminders as unavailable. You need the free Cloudflare account
you already have. Wrangler runs through `bunx`, nothing to install.

## 1. Log in

```sh
cd workers/push
bunx wrangler login
```

## 2. Create the KV namespace

```sh
bunx wrangler kv namespace create SUBSCRIPTIONS
```

Copy the printed `id` into `workers/push/wrangler.toml`, replacing `REPLACE_WITH_KV_NAMESPACE_ID`
(a namespace id is not a secret; commit it). The binding name must stay `SUBSCRIPTIONS`.

## 3. Generate the VAPID keys

From the repo root:

```sh
bun tools/vapid.ts
```

It prints `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (base64url). Keep the private key out of git,
chat and screenshots. Generate once: a new pair invalidates every existing subscription.

## 4. Set the secrets

Each command asks for the value on stdin:

```sh
cd workers/push
bunx wrangler secret put VAPID_PUBLIC_KEY    # public key from step 3
bunx wrangler secret put VAPID_PRIVATE_KEY   # private key from step 3
bunx wrangler secret put VAPID_SUBJECT       # e.g. mailto:you@example.com
```

## 5. Deploy

```sh
bunx wrangler deploy
```

Wrangler prints the Worker URL, like `https://slaydoku-push.<your-subdomain>.workers.dev`. The cron
trigger (`*/5 * * * *`) is registered by the same deploy.

## 6. Paste the values into the app

Edit `REMINDER_CONFIG` in `src/pwa/reminder.ts`:

```ts
export const REMINDER_CONFIG = {
  workerUrl: 'https://slaydoku-push.<your-subdomain>.workers.dev',  // no trailing path
  vapidPublicKey: '<VAPID_PUBLIC_KEY from step 3>',
} as const
```

Both are public values. Merge to `main`; Vercel deploys it. The Worker only accepts requests from
`slaydoku.nl`, `www.slaydoku.nl` and `slaydoku.vercel.app` (`workers/push/src/cors.ts`).

## 7. Check it works

```sh
bunx wrangler tail            # live logs, runs every 5 minutes
bunx wrangler kv key list --binding SUBSCRIPTIONS --remote
```

Turn reminders on in the app for the next full hour, then watch `tail` at that hour. Subscriptions
show up as `sub:<hash>` and `hour:<HH>:<hash>` keys, plus a short-lived `skip:<hash>` (the UTC date the player already solved, 36 hour TTL, from `POST /skip`; the sender leaves that subscription out on that day); `run:<date>:<HH>` is the send progress of an
hour. A push service answering 404/410 removes that subscription automatically.

## Why every five minutes

The free plan allows about 50 outgoing requests per run (KV calls count). The sender therefore
handles 7 subscribers per run and keeps a KV cursor (`run:<date>:<hour>`), so a large hour drains
across several runs, about 84 subscribers per hour at this schedule. Once an hour is done a run
costs one KV read. If an hour ever has more subscribers, tighten the cron or move to a paid plan
(a higher subrequest limit; per subscriber the worst case is 6 subrequests now: record, skip date, push, three deletes; raise `CHUNK_SIZE` in `workers/push/src/sender.ts` with it).

## Free-tier limits (check Cloudflare's pricing pages for current numbers)

- Workers: about 100,000 requests per day (subscribe calls, plus cron runs), 10 ms CPU per
  invocation, about 50 subrequests per invocation. The cron adds 288 runs a day.
- KV: about 100,000 reads, and 1,000 each of writes, deletes and list operations per day. The idle
  cron costs one read per run (about 288 a day). Every subscribe or hour change is 2 writes, each
  sent reminder can cost up to 2 deletes when a subscription expires, and each hour's chunking needs
  list calls: with a few hundred subscribers you stay far below the limits, around a thousand
  active subscribers is where the 1,000 writes per day matter.
- Going over a free limit makes calls fail until the daily reset; nothing is billed on the free plan.

## Privacy footprint

The Worker stores, per subscribed device: the push endpoint URL, the two push keys (`p256dh`,
`auth`), the chosen hour and optionally a language code, and for at most 36 hours the UTC date of a solved puzzle (the skip date). No name, email, account, IP address,
puzzle progress or stats; the app has no accounts. Pushes carry no payload, only the fixed reminder.
Unsubscribing in the app (or the browser revoking permission) deletes the record; dead endpoints
are pruned when a push service reports them gone. This is the one server-side exception to
device-only data (see `CLAUDE.md`). The VAPID private key lives only in Worker secrets.

## Local development

`wrangler dev` serves the Worker locally; set `DEV=true` as a var (`--var DEV:true`) to let
`http://localhost` origins through CORS.

## Automated check and manual live check (SLAY-14.11)

`bun docs/verification/push.ts` builds the app, points a copy of the build at a fake Worker (never the deployed one, no real secrets), and drives headless Chrome through the client flow: the POST /subscribe body, a push delivered with CDP `ServiceWorker.deliverPushMessage`, the notification, its click landing on `/play`, switching off (DELETE) and the About page. It does not reach the real Worker, a real push service delivery, or the cron. That is what this checklist covers, once after each deploy of the Worker or a change to `REMINDER_CONFIG`:

1. Install the app on a real phone (Add to Home Screen on iOS, install on Android) and open it from the icon.
2. Open the reminder row on the start screen (after a solved day), switch it on, choose the next full Amsterdam hour, save, and accept the permission prompt. The row should now say it is on.
3. `bunx wrangler kv key list --binding SUBSCRIPTIONS --remote` (from `workers/push/`) shows a `sub:<hash>` key and an `hour:<HH>:<hash>` key for that hour.
4. At the chosen Amsterdam hour (the cron runs every 5 minutes, so allow up to about 5 minutes), the phone shows the "Slaydoku" notification, with no puzzle information in it. `bunx wrangler tail` shows the run.
5. Tap the notification: the app opens on the play screen.
6. In the app, switch the reminder off and save. The `sub:` and `hour:` keys disappear from the KV list.
7. At the next full hour that was chosen in step 2 (change nothing), no notification arrives.
8. Re-subscribe, then revoke notifications for the app in the phone settings; after the next failed send the subscription is pruned from KV (a push service answering 404/410).
