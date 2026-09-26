# Launch: indexing switch and hosting

The site and the repository are private for now. This page describes the one switch that decides whether search engines may list the site, and how the hosting is set up. The full go-public checklist is part of story SLAY-1.10 and builds on this page.

## The indexing switch

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

### Going public: one commit

```sh
bun tools/indexing.ts on     # or: bun run indexing on
```

This sets `"indexable": true` in `src/brand/site.json` and removes the `X-Robots-Tag` entry from `vercel.json`, both in one go. Commit both files together. `bun tools/indexing.ts off` puts everything back. `bun tools/indexing.ts` alone prints the mode and whether `vercel.json` agrees with the flag.

The tests guard the switch: `src/brand/indexing.test.ts` fails when `vercel.json` and the flag disagree, so flipping only one of the two cannot be merged by accident.

### Checking a deployment

```sh
bun tools/check-share.ts <url>               # mode taken from src/brand/site.json
bun tools/check-share.ts <url> --indexable   # force the indexable checks
bun tools/check-share.ts <url> --noindex     # force the noindex checks
```

The check reads the mode from `src/brand/site.json`, so run it from the commit that was deployed. In noindex mode it wants the noindex header and meta tag, a `robots.txt` that disallows everybody but the preview bots, and no sitemap. In indexable mode it wants no noindex anywhere, an open `robots.txt` that names the sitemap, and a `sitemap.xml` listing every page. Both modes check the share tags, the share image, the manifest and icons, the `/level/demo` and `/about` deep links and the offline worker. `vite preview` does not apply `vercel.json`, so use `--skip-headers` for a local run.

After the flip, also ask Google Search Console and Bing Webmaster Tools to fetch the site (not automated).

## Hosting: the Vercel project

- Project name: `slaydoku`, framework preset Vite, build command `bun run build`, output `dist` (all in `vercel.json`).
- Production branch: `main`. Every other branch is skipped by `ignoreCommand` in `vercel.json` (the hobby plan has a daily deploy limit). Preview deployments made by hand with `vercel deploy` are not affected by it.
- The site URL in the share tags (`og:url`, `og:image`, the sitemap) comes from `VERCEL_PROJECT_PRODUCTION_URL` at build time. A custom domain is not set up yet; when it is, the next production build picks it up.
- The project is connected to the GitHub repository with the Vercel GitHub app. The repository is private, so the app needs access to it (GitHub settings, Applications, Vercel, Configure).
