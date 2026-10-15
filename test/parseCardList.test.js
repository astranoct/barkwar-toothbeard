const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCardList } = require('../helperFunctions/parseCardList.js');

test('one card per line, blank lines skipped', () => {
  assert.deepEqual(parseCardList('Sol Ring\n\n  Mudhole  \r\nIsland'), ['Sol Ring', 'Mudhole', 'Island']);
});

test('strips bullets and quantities', () => {
  assert.deepEqual(parseCardList('- Sol Ring\n* 4 Island\n2x Mudhole\n3x  Opt'), ['Sol Ring', 'Island', 'Mudhole', 'Opt']);
});

test('does not eat numbers that are part of a card name', () => {
  assert.deepEqual(parseCardList('1996 World Champion'), ['1996 World Champion']);
});

test('ignores old Need:/Want: headers', () => {
  assert.deepEqual(parseCardList('Need:\nSol Ring\nWant:\nMudhole\nwants'), ['Sol Ring', 'Mudhole']);
});

test('removes duplicates case-insensitively, keeping the first spelling', () => {
  assert.deepEqual(parseCardList('Sol Ring\nsol ring\nSOL RING'), ['Sol Ring']);
});

test('empty input gives an empty list', () => {
  assert.deepEqual(parseCardList(''), []);
  assert.deepEqual(parseCardList('\n  \n'), []);
});
