const test = require('node:test');
const assert = require('node:assert/strict');
const { createTradelistEmbed, createTradelinksEmbed } = require('../helperFunctions/formatEmbed.js');

test('tradelist embed links each card to an exact-name Scryfall search', () => {
  const embed = createTradelistEmbed('bob', ['Sol Ring']).toJSON();
  assert.equal(embed.title, 'bob is looking for (1)');
  assert.equal(embed.description, '[Sol Ring](https://scryfall.com/search?q=!%22Sol%20Ring%22)');
});

test('card names with brackets and parentheses cannot break the link', () => {
  const { description } = createTradelistEmbed('bob', ['Odd [Card] (Test)']).toJSON();
  assert.ok(description.startsWith('[Odd \\[Card\\] (Test)]('));
  assert.ok(description.endsWith('%28Test%29%22)'));
});

test('a very long list is cut off within Discord limits', () => {
  const cards = Array.from({ length: 600 }, (_, i) => `Card Number ${i}`);
  const { description } = createTradelistEmbed('bob', cards).toJSON();
  assert.ok(description.length <= 4096);
  assert.match(description, /…and \d+ more$/);
});

test('empty list shows a hint instead of a blank embed', () => {
  const { description } = createTradelistEmbed('bob', []).toJSON();
  assert.match(description, /No cards listed yet/);
});

test('links appear in their own field', () => {
  const embed = createTradelistEmbed('bob', ['Sol Ring'], 'https://a.com', 'https://b.com').toJSON();
  assert.equal(embed.fields[0].name, 'Links');
  assert.match(embed.fields[0].value, /Collection.*Tradebinder/);
});

test('trade links embed without links shows a hint', () => {
  const embed = createTradelinksEmbed('bob').toJSON();
  assert.match(embed.description, /No links/);
});
