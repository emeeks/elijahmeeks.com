# elijahmeeks.com
Elijah Meeks's static portfolio, writing, and project archive. Published with GitHub Pages.

## Editing and publishing

Use Node 22 or newer:

```sh
npm ci
npm run build
npm run check
npm run preview
```

Preview at http://localhost:8080. Push to `master` to build, check internal links and images, and deploy automatically with GitHub Actions. No server, database, or hosting credentials are needed.

- `site/home.html`: homepage content.
- `site/style.css`: responsive styles.
- `site/content/`: historical Markdown articles and project descriptions.
- `site/legacy-links.js`: original hash bookmark compatibility.
- `site/writing/entries.json`: recovered writing, publication metadata, and preserved full text.
- `site/writing/recovery.json`: source inventory, exclusions, unavailable figures, and recovery limits.
- `site/writing-search.js`: browser-local search, publication filters, and pagination.
- `scripts/build-writing.mjs`: writing collection, individual article pages, and portable catalog.
- `scripts/build.mjs`: static HTML generation, archive index, sitemap, and metadata.
- `dist/images/`: 75 original images recovered from the public Bluehost site. Keep these tracked.
- `dist/rss.xml` and `dist/misc/bluesky.swf`: preserved historical feed and linked download. Flash content requires historical software and is retained as an archival download.
- `src/`, `gulpfile.js`, and `dist/js/main.js`: original 2015 implementation, retained for reference; the new site does not use them.

Historical articles retain their original wording, dates where available, and external links. External historical destinations may have changed. Avoid treating archived employment details or workshop announcements as current.

See [MIGRATION.md](MIGRATION.md) for the domain cutover and rollback steps.

## Writing collection

The October 2026 recovery includes the former Digital Humanities Specialist blog, posts with Elijah's byline from Stanford's public source repository, public and archived Medium feeds and essays, the Gestalt series, Journal of Digital Humanities articles, and SevenLions posts recovered from Wayback and the Goodreads author blog. Nightingale entries deliberately contain original blurbs and publisher links. Coauthors, source URLs, publication dates when available, and journal licenses remain attached to each entry. Revised versions and translations are separate entries, so the entry count is not a count of unique essays.

The build uses checked-in content and images and does not contact the original sites. Search and filtering run in the visitor's browser. All writing remains browsable without JavaScript.

Original third-party scripts and interactive embeds are replaced with source links. Recovered figures are stored locally; unrecovered figures retain descriptive placeholders and source links. See the recovery record for the exact inventory and known gaps. It is not a claim that every piece ever published has been discovered.

Recovery tooling is retained in `scripts/collect-writing.mjs` and `scripts/prepare-writing.mjs`. Acquisition responses are cached in ignored `.cache/writing/`. These scripts document the recovery process and expect the acquired source indexes; they are not part of routine builds. Edit `site/writing/entries.json` to correct metadata or add a future piece, then build and check normally.
