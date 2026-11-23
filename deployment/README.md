# General Staff on Solo Table

The hosted companion is at https://solo-table.pages.dev/games/paths-of-glory/.
It has direct downloads for the rules, Staff cards, reference sheets and offline HTML.
The three PDFs are served with their original bytes, PDF content type and attachment filenames.

## Build and check

From the repository root:

```
node app/build_app.js
node deployment/build_site.cjs
node --test deployment/hosting.test.mjs
node app/test_companion.cjs
```

The generated `pages-worker.mjs` is the single-module Pages function upload. It embeds the current
companion and the three shipped PDFs. `home.html` adds General Staff to the catalog.
`routes.json` retains the existing function routes and adds General Staff's routes.
Both generated files are excluded from Git and reproduced by the build command above.

## Retaining the other companions

This deployment extends the existing `solo-table` Pages project. It retains all
static paths in `production_snapshot.json`, the existing `headers.txt`, and the
prior function in `baseline-worker.mjs`. The snapshot records the production
deployment ID and the prior function's source commit and SHA-256.

Before publishing, fetch the current Pages project and deployment through the
Cloudflare API. Require its production ID and complete asset manifest to match
the snapshot. If they differ, refresh the baseline from that deployment before
building, so a later update cannot overwrite another companion's release.

For a preview, submit the retained manifest, `headers.txt`, `routes.json` and
`pages-worker.mjs` to the Pages deployments endpoint using a non-production branch.
Check its terminal status and the direct downloads. Then recheck the production
ID and publish the same files to `main`. Record the source commit in the deployment.
