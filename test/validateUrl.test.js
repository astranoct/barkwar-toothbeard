const test = require('node:test');
const assert = require('node:assert/strict');
const { validateUrl } = require('../helperFunctions/validateUrl.js');

test('accepts http and https URLs', () => {
  assert.equal(validateUrl('https://example.com/binder'), 'https://example.com/binder');
  assert.equal(validateUrl('  http://example.com  '), 'http://example.com/');
});

test('rejects other schemes and junk', () => {
  assert.equal(validateUrl('javascript:alert(1)'), null);
  assert.equal(validateUrl('ftp://example.com'), null);
  assert.equal(validateUrl('not a url'), null);
});

test('rejects empty values', () => {
  assert.equal(validateUrl(null), null);
  assert.equal(validateUrl(''), null);
});
