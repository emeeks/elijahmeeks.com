// Preserve bookmarks from the original hash-routed site, including history navigation.
function restoreLegacyLink() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (/^content\/(blog|project|workshops)\/[\w -]+(?:\.md)?$/.test(hash)) {
    const path = hash.replace(/^content\//, '').replace(/\.md$/, '');
    location.replace(`archive/${path}.html`);
  } else {
    const pages = { blog: 'archive.html#blog', 'project-page': 'archive.html#projects', essays: 'archive.html#essays', repos: 'archive.html#code', workshops: 'archive.html#workshops', home: './' };
    if (pages[hash]) location.replace(pages[hash]);
  }
}
restoreLegacyLink();
addEventListener('hashchange', restoreLegacyLink);
