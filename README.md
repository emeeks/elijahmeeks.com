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
- `scripts/build.mjs`: static HTML generation, archive index, sitemap, and metadata.
- `dist/images/`: 75 original images recovered from the public Bluehost site. Keep these tracked.
- `dist/rss.xml` and `dist/misc/bluesky.swf`: preserved historical feed and linked download. Flash content requires historical software and is retained as an archival download.
- `src/`, `gulpfile.js`, and `dist/js/main.js`: original 2015 implementation, retained for reference; the new site does not use them.

Historical articles retain their original wording, dates where available, and external links. External historical destinations may have changed. Avoid treating archived employment details or workshop announcements as current.

See [MIGRATION.md](MIGRATION.md) for the domain cutover and rollback steps.
