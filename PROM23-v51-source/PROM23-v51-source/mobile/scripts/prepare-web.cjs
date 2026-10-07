// Expo's single-page export ignores +html.tsx; normalize the generated preview shell.
const fs = require('node:fs');
const path = require('node:path');
const previewStyle = '<style>body{background:#E9EBF0}*:focus-visible{outline:2px solid #3D4471;outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}</style>';
function normalizePreviewHtml(input) {
  if (typeof input !== 'string' || !/<\/head>/i.test(input)) throw new Error('Preview HTML requires a head element.');
  // A repeated export preparation must not accumulate metadata or duplicate our styles.
  let html = input.replace(/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/gi, '')
    .split(previewStyle).join('');
  html = html.replace('<html lang="en">', '<html lang="ru">').replace(/<title>.*?<\/title>/s, '<title>Промышленник — prom23.ru</title>')
  .replace('You need to enable JavaScript to run this app.', 'Для работы приложения включите JavaScript.')
    .replace(/<\/head>/i, `<meta name="robots" content="noindex, nofollow" />${previewStyle}</head>`);
  return html;
}
module.exports = { normalizePreviewHtml };
if (require.main === module) {
  const file = path.resolve(__dirname, '../dist/index.html');
  fs.writeFileSync(file, normalizePreviewHtml(fs.readFileSync(file, 'utf8')));
}
