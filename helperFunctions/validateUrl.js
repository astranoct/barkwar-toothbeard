/**
 * Returns the normalized URL string if `value` is a valid http(s) URL, otherwise null.
 * Links end up in embed markdown, so anything else is rejected.
 * @param {string|null} value
 * @returns {string|null}
 */
function validateUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

module.exports = {
  validateUrl,
};
