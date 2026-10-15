const test = require('node:test');
const assert = require('node:assert/strict');
const { describeUser } = require('../helperFunctions/userDisplay.js');

const user = { globalName: 'Global Name', username: 'plain_name', displayAvatarURL: () => 'https://cdn/user.png' };
const member = { displayName: 'Server Nick', displayAvatarURL: () => 'https://cdn/member.png' };

test('uses the server nickname and avatar when the member is known', () => {
  assert.deepEqual(describeUser(user, member), { displayName: 'Server Nick', avatarUrl: 'https://cdn/member.png' });
});

test('falls back to the global display name, then the username', () => {
  assert.deepEqual(describeUser(user, null), { displayName: 'Global Name', avatarUrl: 'https://cdn/user.png' });
  assert.equal(describeUser({ ...user, globalName: null }, null).displayName, 'plain_name');
});

test('ignores a bare data object from an uncached member', () => {
  const bare = { nick: 'Nick', roles: [] }; // no helper methods
  assert.deepEqual(describeUser(user, bare), { displayName: 'Global Name', avatarUrl: 'https://cdn/user.png' });
});

test('asks Discord for a small png avatar', () => {
  let options;
  describeUser({ ...user, displayAvatarURL: (o) => { options = o; return 'x'; } });
  assert.deepEqual(options, { extension: 'png', size: 128 });
});
