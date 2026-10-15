const test = require('node:test');
const assert = require('node:assert/strict');
const { websiteButtonRow } = require('../helperFunctions/webLink.js');

const buttonUrl = (row) => row.toJSON().components[0].url;

test('no button when the website address is not configured', () => {
  assert.equal(websiteButtonRow('123', undefined), null);
  assert.equal(websiteButtonRow('123', ''), null);
});

test('inside a server the button opens that server page', () => {
  const row = websiteButtonRow('123', 'https://example.herokuapp.com');
  assert.equal(buttonUrl(row), 'https://example.herokuapp.com/servers/123');
  assert.equal(row.toJSON().components[0].label, 'View on website');
});

test('outside a server the button opens the front page', () => {
  assert.equal(buttonUrl(websiteButtonRow(null, 'https://example.herokuapp.com/')), 'https://example.herokuapp.com/');
});

test('a trailing slash in the setting does not matter', () => {
  assert.equal(buttonUrl(websiteButtonRow('9', 'https://a.com/')), 'https://a.com/servers/9');
});

test('rejects addresses that are not http(s)', () => {
  assert.equal(websiteButtonRow('1', 'not a url'), null);
  assert.equal(websiteButtonRow('1', 'javascript:alert(1)'), null);
});
