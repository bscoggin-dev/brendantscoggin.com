# Brendan Scoggin's Professional Portfolio

Welcome to the official repository for **[brendantscoggin.com](https://brendantscoggin.com/)**.

This website is a clean, modern, and fully responsive digital portfolio showcasing Brendan's experience in:
* **Operations Strategy & Process Optimization**
* **Large-Scale E-Commerce & Logistics**
* **Regional Expansion & Scale**
* **Early-Stage Autonomous Technology (Waymo)**
* **Creative Production & Technical Integration**

Built using HTML5, CSS3, and styled with premium custom glassmorphic aesthetics. Served locally via Vite.

## Development

To run the local testing development server:
```bash
npm install
npm run dev
```

## Verify

```bash
npm run verify                                        # the local files
BASE_URL=https://brendantscoggin.com npm run verify   # a deployed host
scripts/parity.sh https://old-host https://new-host   # status + redirect of every committed path
```

## Deploy

The site is static files served by a Cloudflare Worker with static assets (`wrangler.jsonc`,
Worker `brendantscoggin-site`). There is no build step.

```bash
npx wrangler login        # once
scripts/deploy.sh         # uploads an export of the COMMITTED files
```

`scripts/deploy.sh` exports `HEAD` (minus `.gitignore`, `CNAME` and the deploy tooling), so
uncommitted edits, `node_modules` and `.git` are never published. It also generates the rewrite
rules that keep `/resume`, `/resume.html`, `/tools/mac-maid/` and `/` all answering 200, as they did
on GitHub Pages. To stage a change first, add a `stage.brendantscoggin.com` custom-domain route to
`wrangler.jsonc`, deploy, run the checks above against it, then remove the route.

`www` is a proxied placeholder record plus a zone redirect rule (301 to the apex, path and query
kept). Analytics injection is turned off by a zone configuration rule so the page CSP stays as is.

## Rollback

GitHub Pages stays configured as the standby (the `CNAME` file in this repo). To go back to it, in
Cloudflare DNS: delete the Worker custom domain `brendantscoggin.com` and the proxied `www` record,
then add four DNS-only `A` records on the apex (`185.199.108.153`, `185.199.109.153`,
`185.199.110.153`, `185.199.111.153`) and a DNS-only `CNAME` `www` -> `bscoggin-dev.github.io`.
