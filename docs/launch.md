# Launch: go-public checklist, indexing switch and hosting

Slaydoku is private for now: the repository, and the site in noindex mode. This page is the owner's list for making it public and open for search engines, in order, with commands that can be pasted as they are. The reference sections after the checklist (the indexing switch, hosting) say how the pieces work. The evidence that the product itself is ready is in [docs/verification/report.md](verification/report.md).

Items marked **OWNER-ONLY** change the outside world (visibility, DNS, hosting accounts, repository settings) and are for the owner to run, not for a script or an assistant. Everything else can be run by anyone with the repository.

```sh
# Once per shell, from the repository root. No account name is written in this page (the personal-data audit scans it too).
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "$REPO"
```

## Go-public checklist

Tick in this order; 1 to 4 can be done while the repository is still private.

### 1. Name, domain and trademark check

- [ ] The name **Slaydoku** is free enough to use: search for it as a word and next to "puzzle", "game", "murdoku" in a search engine, the App Store and Google Play, GitHub, and the trademark registers of your country and the EU (EUIPO TMview: <https://www.tmdn.org/tmview/>, WIPO Global Brand Database: <https://branddb.wipo.int/>). A near name in game software (class 9, 41) is the one to look for. Note the date and the result in the release notes.
- [ ] A domain is available if you want one (`slaydoku.com`, `.app`, `.net`): `whois slaydoku.com` or your registrar. Without a domain the site stays on `slaydoku.vercel.app` (see step 9).
- [ ] The **original game, Murdoku by Manuel Garand**, is credited and never confused with this one: the About page has the credit section and the README ends with a Credit section. Check that no text, icon, share card or metadata calls Slaydoku "Murdoku" or implies it is the original: `git grep -n -i murdoku -- . ':!docs' ':!backlog'` lists today: the credit lines (About page strings and their test, README Credit and Contributing, CLAUDE.md) and code comments that name the rule set ("the Murdoku rules"), which is fine. One to decide: `src/engine/model/tutorial.fixture.ts` is a test fixture transcribed from the public rules page of another Murdoku site (layout and solution of a 4x4 tutorial puzzle, no art, no text), used by five test files; the README promises no puzzles of other products, so either keep it and say so, or replace it by an own 4x4 puzzle. The rule is also in CLAUDE.md.

### 2. README and license review

- [ ] `LICENSE` is MIT, `Copyright (c) 2026 Slaydoku contributors` (`head -4 LICENSE`); `package.json` says `"license": "MIT"`. Decide that you are fine with everything in the tree being MIT.
- [ ] Read `README.md` top to bottom as a stranger would. Known to fix before it goes public: the opening still says "**Status: work in progress, not public yet.** The daily flow and the schedule are not built yet. What runs today is one demo level ..." (the daily flow, stats, share card and a 120-day schedule exist now), and it links `MIGRATION.md`, a leftover of the clone from the private prototype: read it and delete or rewrite it (`git grep -n -i migration`).
- [ ] The README does not mention the private prototype, its language, or any person. `bun run audit:personal` (step 4) enforces the names it knows about, but only you know what else is personal.
- [ ] Third-party material: there are no images, fonts or puzzle data of other products. The dependencies are React 19 and build tools (`package.json`), all MIT/Apache; the brand images are drawn in this repository (`src/brand/*.svg`).

### 3. About page: contact placeholder

- [ ] The About page (`/about`) still says "Contact details will be added here." Replace it with a real way to reach you (a mailbox made for this, or the issue tracker URL once the repository is public). One place: `contact.placeholder` in `src/ui/about/strings.ts`; the test `src/ui/about/about.test.tsx` expects that string ("names the MIT license and holds a contact placeholder"), so change both in the same commit. Find it: `git grep -n "Contact details will be added"`.
- [ ] Do not put an address in the tree that the personal-data audit does not know about: the audit fails on any e-mail address except `noreply` ones. If you want a contact address on the page, add it to `ALLOWED_EMAIL_MARKERS` in `tools/audit-personal.ts` deliberately (one explicit line), or use a link instead of an address.
- [ ] Read the rest of the About page once on the live site: how it works, the Murdoku credit, privacy (everything stays on the device, no accounts, no tracking), the license line.

### 4. Personal-data audit and secrets scan (tree and history)

- [ ] The personal-data audit is green for the working tree **and the whole git history**:

  ```sh
  bun run audit:personal
  ```

  It scans every file of the tree, then every commit message, every ref name and annotated tag message, every file name that ever existed and every file version reachable from any ref, with the same deny-list (base64 in `tools/audit-personal.ts`). The one allowance is the author and committer identity of the owner as commit metadata (name and address as a pair): it is read from `git config user.name` and `user.email` on your machine, or from `AUDIT_ALLOWED_IDENTITY="Name <address>"`, and never from the tree. Cost: about half a second for this repository (59 commits, 1016 file versions); it grows linearly with the history (every unique file version is read once, one `git cat-file --batch` pass), so a history ten times larger takes seconds, not minutes. A shallow clone is refused.

  In CI (`.github/workflows/ci.yml`) the job checks out the full history (`fetch-depth: 0`) and reads the allowed identity from the repository **variable** `AUDIT_ALLOWED_IDENTITY`. Set it once (a variable, not a secret; the value is the same as your commit identity):

  ```sh
  gh variable set AUDIT_ALLOWED_IDENTITY --repo "$REPO" --body "$(git config user.name) <$(git config user.email)>"
  ```

  Until it is set, CI fails on the commits of the owner, and the message says so.
- [ ] **Merge commit messages.** GitHub writes `Merge pull request #N from <account>/<branch>` into the message of every merge commit made with the Merge button. That subject contains the owner's GitHub account name, which is a deny-list term (rule `account`), so the history audit fails on it, and on every future merge made this way. This is a finding of the history audit, not a bug in it: the message is content, and the allowance covers author and committer fields only. Decide one of: (a) merge pull requests with **Squash and merge** from now on (the subject is the PR title, no account name; repository Settings, General, Pull Requests: untick "Allow merge commits"), and for the merges already in the history either accept the account name, which is public anyway as part of `github.com/<account>/slaydoku` once the repository is public, and then remove the `account` rule for commit messages on purpose (a reviewed change to `tools/audit-personal.ts`), or (b) rewrite the history before it goes public (destructive, owner-only, invalidates every open branch and PR; not done by this story). Run `bun run audit:personal` after either.
- [ ] Secrets scan of the tree and of every revision of the history, without any service (it also works on a private repository):

  ```sh
  # Common token shapes: AWS key ids, GitHub tokens, Slack tokens, API keys (sk-...), Google API keys, private key blocks, JWTs,
  # and quoted values assigned to password/secret/token/api_key names. This page is excluded (it holds the pattern itself).
  P='AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}|xox[abprs]-[A-Za-z0-9-]{10,}|sk-(ant-)?[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN ([A-Z]+ )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}|(password|passwd|secret|token|api[_-]?key)[A-Za-z0-9_]*["'"'"']? *[:=] *["'"'"'][^"'"'"' ]{8,}'
  git grep -I -n -i -E "$P" -- . ':!bun.lock' ':!docs/launch.md'                                     # the working tree
  git grep -I -n -i -E "$P" $(git rev-list --all) -- . ':!bun.lock' ':!docs/launch.md'               # every commit of every ref
  git log --all --name-only --format= | sort -u | grep -E '(^|/)(\.env|.*\.pem$|.*\.key$|id_rsa)'    # key or env files ever committed
  ```

  Result when this page was written (2026-09-27, 59 commits): no match in the tree, none in any revision, no env, `.pem`, `.key` or `id_rsa` file ever committed. Any match means: revoke that credential first (assume it leaked), then decide about the history. Run it again right before step 11. The repository holds no secret by design: the site is a static build, and Vercel and GitHub tokens live in your accounts, not in files (`.vercel/` and `.env*` are not in the tree; `*.local` is git-ignored).
- [ ] When the repository is public, GitHub's own secret scanning and push protection switch on for it (Settings, Code security); check that they are on.

### 5. Vercel: connect the GitHub repository

The Vercel project `slaydoku` exists (created with the CLI) but is **not connected to the repository yet**, so nothing deploys on a push. **OWNER-ONLY** (needs your Vercel and GitHub accounts).

- [ ] Give the Vercel GitHub app access to the private repository: GitHub, Settings, Applications, Installed GitHub Apps, Vercel, Configure, under "Repository access" pick Only select repositories and add `slaydoku` (or All repositories), Save.
- [ ] Connect Git in the Vercel project: Vercel dashboard, project `slaydoku`, Settings, Git, Connect Git Repository, pick the repository. Or from the repository root with the CLI:

  ```sh
  vercel link --yes --project slaydoku          # once, if .vercel/ is missing on this machine
  vercel git connect "$(git remote get-url origin)"
  ```

- [ ] Production branch is `main` (Settings, Git, Production Branch). Framework preset Vite, build command and output come from `vercel.json` (`bun run build`, `dist`); do not override them in the dashboard.
- [ ] **A push to main deploys.** Merge any change to main (the launch-checklist PR itself does), then:

  ```sh
  vercel ls slaydoku                       # newest deployment: Production, Ready, and it appears right after the push
  ```

  or watch the Deployments tab: the deployment of the merge commit (source: the Git commit, not a CLI upload) must reach Ready and be the current Production deployment.
- [ ] **Other branches are skipped.** `ignoreCommand` in `vercel.json` (`[ "$VERCEL_GIT_COMMIT_REF" != "main" ]`) cancels every build whose branch is not main (the hobby plan has a daily deployment limit). Push a throwaway branch and check that its deployment shows "Canceled" with "Ignored Build Step", then delete it:

  ```sh
  git switch -c chore/ignore-check && git commit --allow-empty -m "chore: check that vercel skips branches" && git push -u origin chore/ignore-check
  # Vercel, Deployments: the branch deployment is Canceled (Ignored Build Step). Then:
  git push origin --delete chore/ignore-check && git switch main && git branch -D chore/ignore-check
  ```

- [ ] After the first Git deployment, run the production check (below, "Checking a deployment") against `https://slaydoku.vercel.app`.

### 6. GitHub Actions settings

- [ ] Actions are enabled for the repository (Settings, Actions, General, Allow all actions, or at least the actions in `.github/workflows/`: `actions/checkout`, `oven-sh/setup-bun`, `actions/upload-artifact`).
- [ ] Settings, Actions, General, Workflow permissions: tick **Allow GitHub Actions to create and approve pull requests**. Without it the monthly schedule top-up fails at `gh pr create`. The CLI equivalent:

  ```sh
  gh api -X PUT "repos/$REPO/actions/permissions/workflow" -F can_approve_pull_request_reviews=true
  gh api "repos/$REPO/actions/permissions/workflow"          # can_approve_pull_request_reviews: true
  ```

- [ ] Rehearse the top-up once, nothing is committed (a dry run generates 3 days in the runner and shows the plan and the diff stat in the job summary):

  ```sh
  gh workflow run schedule-top-up.yml --ref main -f dry_run=true -f force=true -f days=3
  gh run watch "$(gh run list --workflow schedule-top-up.yml --limit 1 --json databaseId -q '.[0].databaseId')" --exit-status
  ```

- [ ] The repository variable `AUDIT_ALLOWED_IDENTITY` is set (step 4) and CI is green on main.

### 7. Branch protection (suggested)

Solo owner, so keep it light: no rule that needs a second reviewer. Branch protection on a private repository needs a paid GitHub plan, so this step is normally done right after step 11 (public repositories get it for free).

- [ ] Suggested for `main`: pull request required, no force pushes, no deletion, and the CI job `verify` required. Two catches: (1) pull requests opened by the schedule top-up workflow do not start CI (a GitHub rule for pull requests made with the workflow token), so with `verify` required the top-up pull request cannot be merged until you close and reopen it once to start CI (a human action, see docs/authoring/schedule.md); (2) do not require approvals: you cannot approve your own pull request.

  ```sh
  gh api -X PUT "repos/$REPO/branches/main/protection" \
    -F required_status_checks[strict]=true -f 'required_status_checks[contexts][]=verify' \
    -F enforce_admins=false -F required_pull_request_reviews=null -F restrictions=null \
    -F allow_force_pushes=false -F allow_deletions=false
  ```

- [ ] While you are in Settings, General: untick "Allow merge commits" and keep "Allow squash merging" (see the merge commit finding in step 4).

### 8. The indexing switch

Do this **after** the site is deployed from Git (step 5), the About page is done (step 3) and, if you want a domain, after step 9, because the sitemap and the share tags carry the site URL of the build. One commit, four places at once (details in "The indexing switch" below):

```sh
git switch -c chore/indexing-on
bun tools/indexing.ts on          # src/brand/site.json -> {"indexable": true}; X-Robots-Tag removed from vercel.json
bun tools/indexing.ts             # prints the mode and that vercel.json agrees
bun run test --maxWorkers=1 src/brand   # the guard test: flag and vercel.json must agree
git add src/brand/site.json vercel.json
git commit -m "feat(site): open the site for search engines"
git push -u origin chore/indexing-on   # open a PR, merge it; main deploys
```

- [ ] After the deployment of that commit is Ready, run the production check in **indexable mode** (it reads the mode from `site.json` of the commit that was deployed; `--indexable` forces it):

  ```sh
  bun tools/check-share.ts https://slaydoku.vercel.app --indexable     # or your custom domain
  ```

  It wants no noindex anywhere (meta tag, header, `robots.txt`), an open `robots.txt` that names the sitemap, and a `sitemap.xml` that lists `/` and `/about`, on top of the share tags, image, manifest, deep links and offline worker. **OWNER-ONLY** afterwards: ask Google Search Console and Bing Webmaster Tools to fetch the site and the sitemap (`<site>/sitemap.xml`). To take it back: `bun tools/indexing.ts off`, commit both files, deploy.

### 9. Custom domain (optional, OWNER-ONLY)

- [ ] Buy or pick the domain (step 1). Add it to the project: `vercel domains add slaydoku.example slaydoku` (or Vercel, project, Settings, Domains), then set the DNS records Vercel shows (an `A` record to `76.76.21.21` for an apex domain, or a `CNAME` to `cname.vercel-dns.com` for a subdomain) at your registrar. Wait for "Valid Configuration" and the certificate.
- [ ] Make the custom domain the primary production domain (Settings, Domains, the domain, Set as primary) so `VERCEL_PROJECT_PRODUCTION_URL` becomes it: the share tags (`og:url`, `og:image`), the sitemap and the site line on the share card (`SITE_URL`, `src/share/site.ts`) take it from the **next production build**. Trigger one (an empty commit on main, or Redeploy in Vercel) and run `bun tools/check-share.ts https://<domain>` (add `--indexable` after step 8). Note: players who shared a card before the switch keep the old host in their text; the old `slaydoku.vercel.app` keeps redirecting or serving.
- [ ] Then flip the indexing switch (step 8) if you have not yet, so the sitemap is built for the domain from the start.

### 10. Launch date

`LAUNCH_DATE` in `src/schedule/launch.ts` is `2026-10-12`. Puzzle number 1 is played on that UTC date, number n on the (n-1)th day after. Checked on 2026-09-27: it equals the first scheduled day (`src/content/schedule/index.json`: `launch` and `first` both `2026-10-12`, 120 days, last day `2027-02-08`), so puzzle #1 is on launch day, #120 on 2027-02-08. Before 2026-10-12 the app shows "Slaydoku starts on 12 October" with a countdown, and after the last scheduled day "New puzzles are coming soon". The monthly top-up is not due yet (120 days left; due below 60, floor 30): it will generate 90 days on 2027-01-01, when 38 remain.

- [ ] Keep it as it is when you make the repository public and open the site before 2026-10-12: the start screen counts down to launch day, players see the same thing.
- [ ] If launch moves, change the constant **and** regenerate the schedule for the new date (the puzzle of a date does not depend on the launch date, only its number does, so the days stay the same; the first days before a later launch are dropped, days before an earlier launch are made). In one commit:

  ```sh
  NEW=2026-11-02                        # the new launch day
  # 1. src/schedule/launch.ts: export const LAUNCH_DATE = '<NEW>'
  bun run schedule --start "$NEW" --days 120 --launch "$NEW" --out /tmp/slaydoku-schedule --jobs 4   # into an EMPTY folder, about a minute
  rm -rf src/content/schedule && mv /tmp/slaydoku-schedule src/content/schedule
  bun run schedule:check && bun run test --maxWorkers=1     # index.json launch must equal the constant (a test checks it)
  ```

  Then look at the places that name a date: `docs/daily-flow.md` (scheduled dates), the date override of the verification drivers (`docs/verification/daily.ts`: puzzle #4 is 2026-10-15 while launch is 2026-10-12), and run `bun run verify:phone` again.
- [ ] A launch date is a UTC date: at 00:00 UTC (02:00 in the Netherlands in summer time, 01:00 in winter) puzzle #1 opens for everybody.

### 11. Make the repository public (OWNER-ONLY)

Only when steps 1 to 10 are done. This cannot be undone by a script: once public, clones and forks exist, and search engines and archives keep copies.

- [ ] Last checks, from a clean checkout of main:

  ```sh
  git fetch origin && git switch main && git merge --ff-only origin/main
  bun run lint && bun run typecheck && bun run test --maxWorkers=1 && bun run build
  bun run audit:personal            # tree and history: 0 hits
  ```

- [ ] **OWNER-ONLY.** Flip the visibility:

  ```sh
  gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences
  gh repo view "$REPO" --json visibility,url -q '.visibility + " " + .url'     # PUBLIC
  ```

- [ ] Right after: turn on branch protection (step 7), check secret scanning and push protection (step 4), and confirm that CI still passes on a fresh pull request. Set the repository description and topics (`gh repo edit "$REPO" --description "A new murder mystery puzzle every day" --add-topic puzzle --add-topic logic-puzzle`) and the website (`gh repo edit "$REPO" --homepage https://slaydoku.vercel.app`).
- [ ] To go private again if something is wrong: `gh repo edit "$REPO" --visibility private --accept-visibility-change-consequences` (what was copied stays copied).

### 12. Post-launch routine

- **Schedule top-up.** Nothing by hand while the workflow runs (`.github/workflows/schedule-top-up.yml`, the 1st of every month, 06:00 UTC). When the pull request "Schedule: <first> to <last>" appears (90 new days, only added lines), read the diff, run CI once by closing and reopening the pull request, merge it. Check the state any time: `bun run schedule:check` (days left after today; exit 1 under 30) and `bun run schedule:next` (is a top-up due, and the command). A red run of the workflow with "Schedule is running dry" is the alarm: at 30 days left there is a month to fix it. Details: docs/authoring/schedule.md.
- **Reading the numbers.** Slaydoku collects nothing: statistics and streaks live in each player's browser and nothing is sent, so there are no player numbers to read. What you can look at: the Vercel project (the traffic, bandwidth and error graphs, and the runtime logs), Search Console (impressions and clicks after step 8), GitHub traffic and stars, and your own device's Stats card. If you ever want counts of players, that is a new decision (privacy note, About page), not something to add quietly.
- **The expert day.** Exactly one expert puzzle per UTC week, on a weekday drawn per week (so it moves: not always Friday). Know what is coming, and check the day yourself before it opens (play it on the date override, `?date=<day>` on `localhost`, see docs/daily-flow.md):

  ```sh
  bun -e 'import{readdirSync as d,readFileSync as r}from"node:fs";const D="src/content/schedule";for(const f of d(D).filter(n=>/^\d{4}-\d{2}\.json$/.test(n)).sort())for(const l of r(`${D}/${f}`,"utf8").split("\n")){const m=/"n":(\d+),"date":"([\d-]+)","size":(\d+),"tier":"expert"/.exec(l);if(m)console.log(m[2],new Date(m[2]+"T00:00:00Z").toLocaleDateString("en",{weekday:"short",timeZone:"UTC"}),m[3]+"x"+m[3],"#"+m[1])}'
  ```

- **Every month:** open the top-up pull request, skim the diff for `fallbackFrom` days (a planned 12x12 that fell back to 9x9), check that Vercel has a Ready production deployment of the latest main.
- **Every deploy:** `bun tools/check-share.ts https://<site>` (plus `--indexable` once open). After a deploy, open players see "A new version is available"; that is the update notice (offline worker), nothing to do.
- **Issues and contact:** read the contact address or issues weekly for the first month; a report of a wrong puzzle means playing that day on the date override and checking its data (`bun run verify <file>`, docs/authoring/README.md); if it is real, fix it forward (a published day only changes on purpose: see "Extending the schedule safely" in docs/authoring/schedule.md).

## Reference: the indexing switch

One decision, "may search engines list Slaydoku", one flag: `src/brand/site.json`.

```json
{ "indexable": false }
```

`false` (the default) keeps the site out of search results. `true` opens it. Everything else follows from the flag:

| Where | noindex (`false`) | indexable (`true`) | How it follows the flag |
|---|---|---|---|
| `<meta name="robots">` in `index.html` | `noindex,nofollow` | `index,follow` | written at build time (`siteMetaPlugin`, `src/brand/site.ts`) |
| `robots.txt` in `dist/` | preview bots (Facebook, Twitter, Slack, Discord, WhatsApp, Telegram, LinkedIn) allowed, everybody else `Disallow: /` | `Allow: /` and a `Sitemap:` line | generated at build time (`src/brand/indexing.ts`) |
| `sitemap.xml` in `dist/` | not built | lists `/` and `/about` with absolute URLs | generated at build time |
| `X-Robots-Tag` header | `noindex,nofollow` on every response | not sent | `vercel.json` (a header cannot depend on a build variable, so this is the one committed copy) |

The link preview bots stay allowed in noindex mode on purpose: a shared link would lose its card otherwise.

### Flipping it: one commit

```sh
bun tools/indexing.ts on     # or: bun run indexing on
```

This sets `"indexable": true` in `src/brand/site.json` and removes the `X-Robots-Tag` entry from `vercel.json`, both in one go. Commit both files together. `bun tools/indexing.ts off` puts everything back. `bun tools/indexing.ts` alone prints the mode and whether `vercel.json` agrees with the flag.

The tests guard the switch: `src/brand/indexing.test.ts` fails when `vercel.json` and the flag disagree, so flipping only one of the two cannot be merged by accident.

### Checking a deployment (production check)

```sh
bun tools/check-share.ts <url>               # mode taken from src/brand/site.json
bun tools/check-share.ts <url> --indexable   # force the indexable checks
bun tools/check-share.ts <url> --noindex     # force the noindex checks
```

The check reads the mode from `src/brand/site.json`, so run it from the commit that was deployed. In noindex mode it wants the noindex header and meta tag, a `robots.txt` that disallows everybody but the preview bots, and no sitemap. In indexable mode it wants no noindex anywhere, an open `robots.txt` that names the sitemap, and a `sitemap.xml` listing every page. Both modes check the share tags, the share image, the manifest and icons, the `/play` and `/about` deep links and the offline worker. `vite preview` does not apply `vercel.json`, so use `--skip-headers` for a local run.

After the flip, also ask Google Search Console and Bing Webmaster Tools to fetch the site (not automated).

## Reference: hosting, the Vercel project

- Project name: `slaydoku`, framework preset Vite, build command `bun run build`, output `dist` (all in `vercel.json`).
- Production branch: `main`. Every other branch is skipped by `ignoreCommand` in `vercel.json` (the hobby plan has a daily deploy limit). Preview deployments made by hand with `vercel deploy` are not affected by it.
- The site URL in the share tags (`og:url`, `og:image`, the sitemap) comes from `VERCEL_PROJECT_PRODUCTION_URL` at build time. A custom domain is not set up yet; when it is, the next production build picks it up.
- The project was created with the Vercel CLI (`vercel project add slaydoku`, then `vercel link`). Connecting it to the GitHub repository (`vercel git connect <repo url>`) needs the Vercel GitHub app to have access to the repository, and the repository is private: the owner opens GitHub, Settings, Applications, Vercel, Configure, adds the repository `slaydoku` to the selected repositories, and then connects it (Vercel project, Settings, Git, Connect Git Repository, or the CLI command). Until that is done nothing deploys on a push; deploy by hand with `vercel deploy` (a project with no production deployment yet promotes its first `vercel deploy` to production).
- No custom domain is set. The default `slaydoku.vercel.app` is public but stays out of search engines (noindex mode).
