const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyCards, describeInvalid, getCardArt } = require('../helperFunctions/scryfall.js');

// Replaces the global fetch with a fake Scryfall for the duration of a test.
function mockScryfall(t, handler) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const { status = 200, body } = await handler(String(url), options);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  t.after(() => { global.fetch = original; });
  return calls;
}

test('returns official spellings and flags unknown cards with a suggestion', async (t) => {
  const calls = mockScryfall(t, (url) => {
    if (url.endsWith('/cards/collection')) {
      return { body: { data: [{ name: 'Sol Ring' }], not_found: [{ name: 'Lightnin Bolt' }] } };
    }
    return { body: { object: 'card', name: 'Lightning Bolt' } };
  });

  const result = await verifyCards(['sol ring', 'Lightnin Bolt']);

  assert.deepEqual(result.valid, ['Sol Ring']);
  assert.deepEqual(result.invalid, [{ name: 'Lightnin Bolt', suggestion: 'Lightning Bolt' }]);
  assert.equal(result.unverified, false);
  assert.ok(calls[0].options.headers['User-Agent']);
});

test('looks up double-faced cards by front face but keeps the full name', async (t) => {
  const calls = mockScryfall(t, () => ({ body: { data: [{ name: 'Fire // Ice' }], not_found: [] } }));

  const result = await verifyCards(['Fire // Ice']);

  assert.deepEqual(JSON.parse(calls[0].options.body).identifiers, [{ name: 'Fire' }]);
  assert.deepEqual(result.valid, ['Fire // Ice']);
});

test('removes duplicates that only differ by face name', async (t) => {
  mockScryfall(t, () => ({ body: { data: [{ name: 'Fire // Ice' }, { name: 'Fire // Ice' }], not_found: [] } }));
  const result = await verifyCards(['Fire', 'Fire // Ice']);
  assert.deepEqual(result.valid, ['Fire // Ice']);
});

test('sends more than 75 cards in several requests', async (t) => {
  const calls = mockScryfall(t, (url, options) => {
    const ids = JSON.parse(options.body).identifiers;
    return { body: { data: ids.map((id) => ({ name: id.name })), not_found: [] } };
  });

  const names = Array.from({ length: 160 }, (_, i) => `Card ${i}`);
  const result = await verifyCards(names);

  assert.equal(calls.length, 3);
  assert.equal(result.valid.length, 160);
});

test('accepts names unverified when Scryfall is unreachable', async (t) => {
  mockScryfall(t, () => ({ status: 500, body: {} }));
  t.mock.method(console, 'error', () => {});

  const result = await verifyCards(['Sol Ring']);

  assert.deepEqual(result, { valid: ['Sol Ring'], invalid: [], unverified: true });
});

test('describeInvalid lists suggestions', () => {
  const text = describeInvalid([{ name: 'a', suggestion: 'B' }, { name: 'c', suggestion: null }]);
  assert.equal(text, '• a — did you mean **B**?\n• c');
});

test('getCardArt returns the cropped art and remembers it', async (t) => {
  const calls = mockScryfall(t, () => ({ body: { image_uris: { art_crop: 'https://img/sol-ring.jpg' } } }));

  assert.equal(await getCardArt('Sol Ring'), 'https://img/sol-ring.jpg');
  assert.equal(await getCardArt('Sol Ring'), 'https://img/sol-ring.jpg');
  assert.equal(calls.length, 1); // the second call came from memory
});

test('getCardArt uses the front face of double-faced cards', async (t) => {
  const calls = mockScryfall(t, () => ({
    body: { card_faces: [{ image_uris: { art_crop: 'https://img/delver.jpg' } }, { image_uris: { art_crop: 'https://img/other.jpg' } }] },
  }));

  assert.equal(await getCardArt('Delver of Secrets // Insectile Aberration'), 'https://img/delver.jpg');
  assert.match(calls[0].url, /exact=Delver%20of%20Secrets$/);
});

test('getCardArt gives null for unknown cards and remembers that', async (t) => {
  const calls = mockScryfall(t, () => ({ status: 404, body: { object: 'error' } }));

  assert.equal(await getCardArt('Not A Real Card'), null);
  assert.equal(await getCardArt('Not A Real Card'), null);
  assert.equal(calls.length, 1);
});

test('getCardArt gives null on errors but does not remember them', async (t) => {
  const calls = mockScryfall(t, () => ({ status: 500, body: {} }));

  assert.equal(await getCardArt('Flaky Card'), null);
  assert.equal(await getCardArt('Flaky Card'), null);
  assert.equal(calls.length, 2); // tried again the second time
});
