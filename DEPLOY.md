# Ship checklist (run before every deploy)

```bash
node build/add-adsense.mjs     # AdSense loader on new pages (and never on 404.html)
node build/add-shell.mjs       # settings.js + mascot.js on new pages
node build/adsense-meta.mjs    # google-adsense-account meta; strips ads off 404
node build/bust-assets.mjs     # ?v=<content hash> to beat Cloudflare's 4h asset cache
node build/gen-sitemap.mjs     # rebuild sitemap.xml from the real page set
```

All five are idempotent. `build/gen-icons.mjs` regenerates the PWA icons.

# Deploying sagardahal123.com.np

Production = **Cloudflare Pages** project `saagar-hub` (`saagar-hub.pages.dev`),
with the custom domains `sagardahal123.com.np` and `www.sagardahal123.com.np`.

The Pages project is **direct-upload** (not Git-connected): pushing to GitHub does
**not** deploy it. Deploy from this folder with wrangler:

```bash
npx -y wrangler@4 pages deploy . --project-name saagar-hub --branch main --commit-dirty=true
```

Login (only needed once, or when the OAuth token expires):

```bash
npx -y wrangler@4 login
```

Notes

- `--branch main` publishes to production; any other branch creates a preview URL.
- `.wrangler/`, `node_modules/` and `.git/` are ignored via `.gitignore`.
- `_redirects` (pretty URLs + old-path 301s) is uploaded with every deploy.
- Local preview without deploying: `node build/serve.mjs` (see the script for the port).
- Google AdSense: the loader for `ca-pub-9617852445804852` is injected into every
  page `<head>` by `node build/add-adsense.mjs` (idempotent), and `ads.txt` lists
  the same publisher ID.
