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
show up as `sub:<hash>` and `hour:<HH>:<hash>` keys; `run:<date>:<HH>` is the send progress of an
hour. A push service answering 404/410 removes that subscription automatically.

## Why every five minutes

The free plan allows about 50 outgoing requests per run (KV calls count). The sender therefore
handles 11 subscribers per run and keeps a KV cursor (`run:<date>:<hour>`), so a large hour drains
across several runs, about 130 subscribers per hour at this schedule. Once an hour is done a run
costs one KV read. If an hour ever has more subscribers, tighten the cron or move to a paid plan
(a higher subrequest limit; raise `CHUNK_SIZE` in `workers/push/src/sender.ts` with it).

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
`auth`), the chosen hour and optionally a language code. No name, email, account, IP address,
puzzle progress or stats; the app has no accounts. Pushes carry no payload, only the fixed reminder.
Unsubscribing in the app (or the browser revoking permission) deletes the record; dead endpoints
are pruned when a push service reports them gone. This is the one server-side exception to
device-only data (see `CLAUDE.md`). The VAPID private key lives only in Worker secrets.

## Local development

`wrangler dev` serves the Worker locally; set `DEV=true` as a var (`--var DEV:true`) to let
`http://localhost` origins through CORS.
