const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../helperFunctions/rateLimiter.js');

test('allows up to max actions per window, then blocks with a retry time', () => {
  let time = 0;
  const check = createRateLimiter({ max: 2, windowMs: 10_000, now: () => time });

  assert.equal(check('a'), 0);
  assert.equal(check('a'), 0);
  assert.equal(check('a'), 10); // blocked until the first hit expires

  time = 4_000;
  assert.equal(check('a'), 6);
});

test('allows again once the window has passed', () => {
  let time = 0;
  const check = createRateLimiter({ max: 1, windowMs: 1_000, now: () => time });

  assert.equal(check('a'), 0);
  assert.ok(check('a') > 0);
  time = 1_000;
  assert.equal(check('a'), 0);
});

test('tracks each key separately', () => {
  const check = createRateLimiter({ max: 1, windowMs: 10_000, now: () => 0 });

  assert.equal(check('a'), 0);
  assert.equal(check('b'), 0);
  assert.ok(check('a') > 0);
});
