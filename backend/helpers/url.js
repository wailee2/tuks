// helpers/url.js
function buildFullUrl(req, relativePath) {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  if (!relativePath) return null;
  // ensure leading slash
  const p = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${p}`;
}

module.exports = { buildFullUrl };
