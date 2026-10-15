const API = 'https://api.scryfall.com';
// Scryfall asks every client to identify itself and send an Accept header.
const HEADERS = {
  'User-Agent': 'BarktoothTradeBot/1.0',
  Accept: 'application/json;q=0.9,*/*;q=0.8',
};

const COLLECTION_BATCH = 75; // max identifiers per /cards/collection request
const MAX_SUGGESTIONS = 10; // fuzzy lookups are one request each, so cap them
const FUZZY_DELAY_MS = 100; // Scryfall asks for 50-100ms between requests

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
    signal: AbortSignal.timeout(8000),
  });
  // 404 is a normal "no such card" answer, not a failure
  if (!res.ok && res.status !== 404) {
    throw new Error(`Scryfall returned ${res.status}`);
  }
  return res.json();
}

/** Asks Scryfall for the single closest card name, or null if there is none / it is ambiguous. */
async function suggestName(name) {
  const body = await fetchJson(`${API}/cards/named?fuzzy=${encodeURIComponent(name)}`);
  return body.object === 'card' ? body.name : null;
}

/**
 * Checks card names against Scryfall.
 * @param {string[]} names
 * @returns {Promise<{
 *   valid: string[],
 *   invalid: {name: string, suggestion: string|null}[],
 *   unverified: boolean
 * }>}
 *   `valid` holds Scryfall's official spelling (so "sol ring" becomes "Sol Ring").
 *   If Scryfall can't be reached, nothing is rejected: `valid` is the input and `unverified` is true.
 */
async function verifyCards(names) {
  const valid = [];
  const notFound = [];

  try {
    for (let i = 0; i < names.length; i += COLLECTION_BATCH) {
      const batch = names.slice(i, i + COLLECTION_BATCH);
      const body = await fetchJson(`${API}/cards/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Full names of double-faced / split cards ("Fire // Ice") don't match exactly,
        // but their front face does, and Scryfall then returns the full official name.
        body: JSON.stringify({ identifiers: batch.map((name) => ({ name: name.split(' // ')[0] })) }),
      });

      // Scryfall returns the matches in request order, so walk the batch alongside them
      const found = body.data || [];
      const missing = new Set((body.not_found || []).map((id) => id.name));
      let f = 0;
      for (const name of batch) {
        if (missing.has(name.split(' // ')[0])) notFound.push(name);
        else if (found[f]) valid.push(found[f++].name);
      }
    }

    const invalid = [];
    for (const [index, name] of notFound.entries()) {
      let suggestion = null;
      if (index < MAX_SUGGESTIONS) {
        if (index > 0) await sleep(FUZZY_DELAY_MS);
        suggestion = await suggestName(name);
      }
      invalid.push({ name, suggestion });
    }

    // "Fire" and "Fire // Ice" are the same card once canonicalized
    return { valid: [...new Set(valid)], invalid, unverified: false };
  } catch (err) {
    console.error('Scryfall check failed, accepting names unverified:', err);
    return { valid: names, invalid: [], unverified: true };
  }
}

/** Human-readable lines for cards that were rejected. */
function describeInvalid(invalid) {
  return invalid
    .map(({ name, suggestion }) => (suggestion ? `• ${name} — did you mean **${suggestion}**?` : `• ${name}`))
    .join('\n');
}

module.exports = {
  verifyCards,
  describeInvalid,
};
