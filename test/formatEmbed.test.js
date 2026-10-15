const test = require('node:test');
const assert = require('node:assert/strict');
const { createTradelistEmbed, createTradelinksEmbed } = require('../helperFunctions/formatEmbed.js');

const names = (n) => Array.from({ length: n }, (_, i) => `Card Number ${i + 1}`);

test('author line shows the name and avatar, title shows the count', () => {
  const embed = createTradelistEmbed({ displayName: 'Victoria', avatarUrl: 'https://a/b.png', cards: ['Sol Ring', 'Mudhole'] }).toJSON();
  assert.equal(embed.author.name, 'Victoria');
  assert.equal(embed.author.icon_url, 'https://a/b.png');
  assert.equal(embed.title, 'Looking for 2 cards');
  assert.equal(embed.footer, undefined);
  assert.equal(embed.timestamp, undefined);
});

test('title is singular for one card', () => {
  const embed = createTradelistEmbed({ displayName: 'v', cards: ['Sol Ring'] }).toJSON();
  assert.equal(embed.title, 'Looking for 1 card');
});

test('short lists put each card in the description as an exact-name Scryfall link', () => {
  const { description, fields } = createTradelistEmbed({ displayName: 'v', cards: ['Sol Ring'] }).toJSON();
  assert.equal(description, '[Sol Ring](https://scryfall.com/search?q=!%22Sol%20Ring%22)');
  assert.equal(fields, undefined);
});

test('links come first, then the updated time, then the cards', () => {
  const { description } = createTradelistEmbed({
    displayName: 'v',
    cards: ['Sol Ring'],
    collectionUrl: 'https://a.com',
    tradebinderUrl: 'https://b.com',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  }).toJSON();
  const lines = description.split('\n');
  assert.equal(lines[0], '[Collection](https://a.com) • [Tradebinder](https://b.com)');
  assert.equal(lines[1], '-# Updated <t:1767225600:R>');
  assert.equal(lines[2], '');
  assert.match(lines[3], /^\[Sol Ring\]/);
});

test('no updated line when the time is unknown', () => {
  const { description } = createTradelistEmbed({ displayName: 'v', cards: ['Sol Ring'] }).toJSON();
  assert.doesNotMatch(description, /Updated/);
});

test('card names with brackets and parentheses cannot break the link', () => {
  const { description } = createTradelistEmbed({ displayName: 'v', cards: ['Odd [Card] (Test)'] }).toJSON();
  assert.ok(description.includes('[Odd \\[Card\\] (Test)]('));
  assert.ok(description.endsWith('%28Test%29%22)'));
});

test('long lists are split into three columns that read down', () => {
  const embed = createTradelistEmbed({ displayName: 'v', cards: names(12) }).toJSON();
  assert.equal(embed.fields.length, 3);
  assert.ok(embed.fields.every((f) => f.inline));
  const [a, b, c] = embed.fields.map((f) => f.value.split('\n'));
  assert.deepEqual([a.length, b.length, c.length], [4, 4, 4]);
  assert.match(a[0], /Card Number 1\]/);
  assert.match(b[0], /Card Number 5\]/);
  assert.match(c[3], /Card Number 12\]/);
  assert.equal(embed.description, undefined); // nothing to say besides the columns
});

test('uneven lists still use every card', () => {
  const embed = createTradelistEmbed({ displayName: 'v', cards: names(10) }).toJSON();
  const total = embed.fields.reduce((sum, f) => sum + f.value.split('\n').length, 0);
  assert.equal(total, 10);
});

test('a very long list is cut off in order, within Discord limits, and says how many are missing', () => {
  const embed = createTradelistEmbed({ displayName: 'v', cards: names(600), websiteHint: true }).toJSON();
  assert.ok(embed.fields.every((f) => f.value.length <= 1024));
  assert.ok(embed.description.length <= 4096);
  const shown = embed.fields.reduce((sum, f) => sum + f.value.split('\n').length, 0);
  assert.ok(shown < 600);
  assert.match(embed.description, new RegExp(`…and ${600 - shown} more: see the full list on the website`));
  // the first column starts at the first card, i.e. it is a prefix of the list, not a scattered sample
  assert.match(embed.fields[0].value.split('\n')[0], /Card Number 1\]/);
});

test('the website hint is only shown when there is a website', () => {
  const { description } = createTradelistEmbed({ displayName: 'v', cards: names(600) }).toJSON();
  assert.match(description, /…and \d+ more$/);
});

test('empty list shows a hint and a friendly title', () => {
  const embed = createTradelistEmbed({ displayName: 'v', cards: [] }).toJSON();
  assert.equal(embed.title, 'Nothing on the list yet');
  assert.match(embed.description, /No cards listed yet/);
});

test('thumbnail is set only when given', () => {
  assert.equal(createTradelistEmbed({ displayName: 'v', cards: [] }).toJSON().thumbnail, undefined);
  const embed = createTradelistEmbed({ displayName: 'v', cards: ['Sol Ring'], thumbnailUrl: 'https://x/y.jpg' }).toJSON();
  assert.equal(embed.thumbnail.url, 'https://x/y.jpg');
});

test('author without an avatar is still valid', () => {
  const embed = createTradelistEmbed({ displayName: 'v', cards: [] }).toJSON();
  assert.equal(embed.author.name, 'v');
  assert.equal(embed.author.icon_url, undefined);
});

test('trade links embed lists the links', () => {
  const embed = createTradelinksEmbed({ displayName: 'bob', collectionUrl: 'https://a.com', tradebinderUrl: 'https://b.com' }).toJSON();
  assert.equal(embed.author.name, 'bob');
  assert.equal(embed.title, 'Trade links');
  assert.equal(embed.description, '[View Collection](https://a.com)\n[View Tradebinder](https://b.com)');
});

test('trade links embed without links shows a hint', () => {
  const embed = createTradelinksEmbed({ displayName: 'bob' }).toJSON();
  assert.match(embed.description, /No links/);
});
