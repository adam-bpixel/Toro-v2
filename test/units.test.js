'use strict';
// Small unit tests for shared helpers. They use fake Discord objects and stop before any call
// that would need MongoDB.
const test = require('node:test');
const assert = require('node:assert/strict');
const { Collection } = require('discord.js');
const { mergeExports } = require('../utils/runtime/mergeExports');
const { parseDuration } = require('../utils/format');
const moderation = require('../services/moderation');

// Without a database the prefix lookup logs that it fell back to the default; that is expected here.
const realError = console.error;
console.error = (...args) => (String(args[0]).startsWith('Could not read the') ? undefined : realError(...args));

test('mergeExports keeps unique names and refuses ambiguous ones', () => {
  const shared = () => {};
  const merged = mergeExports({ a: { one: 1, same: shared, clash: 'a' }, b: { two: 2, same: shared, clash: 'b' } });
  assert.equal(merged.one, 1);
  assert.equal(merged.two, 2);
  assert.equal(merged.same, shared, 'the same value re-exported twice is not a clash');
  assert.throws(() => merged.clash, /"clash" is exported by a, b/);
  assert.deepEqual(Object.keys(merged).sort(), ['one', 'same', 'two']);
});

test('parseDuration understands s, m, h, d and w', () => {
  assert.equal(parseDuration('10m'), 600000);
  assert.equal(parseDuration('2H'), 7200000);
  assert.equal(parseDuration('1w'), 604800000);
  assert.equal(parseDuration('3 d'), 3 * 86400000);
  assert.equal(parseDuration('soon'), null);
  assert.equal(parseDuration(''), null);
});

// A message in a guild where the author (role 5) moderates a target (role 1), and the bot is role 10.
function fakeMessage({ bans = new Collection(), target = null } = {}) {
  const replies = [];
  const role = (position) => ({ highest: { position } });
  const guild = {
    id: 'guild',
    ownerId: 'owner',
    roles: { cache: new Collection() },
    bans: {
      fetch: async (id) => {
        if (id === undefined) return bans;
        if (bans.has(id)) return bans.get(id);
        throw Object.assign(new Error('Unknown Ban'), { code: 10026 });
      },
    },
    members: {
      me: { roles: role(10) },
      fetch: async (id) => (target && target.id === id ? target : Promise.reject(new Error('Unknown Member'))),
      unban: async () => {},
    },
  };
  return {
    replies,
    guild,
    author: { id: 'mod', username: 'mod' },
    member: { id: 'mod', roles: role(5), permissions: { has: () => true } },
    client: { user: { id: 'bot' } },
    channel: { permissionOverwrites: { edit: async () => {} }, permissionsFor: () => ({ has: () => true }) },
    reply: async (payload) => { replies.push(JSON.stringify(payload)); return payload; },
  };
}

const member = (id, extra = {}) => ({ id, roles: { highest: { position: 1 } }, ...extra });

test('unban explains a user who is not banned', async () => {
  const message = fakeMessage();
  await moderation.unban(message, '123456789012345678', '');
  assert.match(message.replies[0], /not banned/);
});

test('unban finds a banned user by ID, mention or username', async () => {
  const user = { id: '123456789012345678', username: 'spammer' };
  for (const query of [user.id, `<@${user.id}>`, '@Spammer']) {
    const message = fakeMessage({ bans: new Collection([[user.id, { user }]]) });
    await moderation.unban(message, query, 'appeal');
    assert.match(message.replies[0], /Unbanned/, `query ${query}`);
  }
});

test('timeout rejects a bad or too long duration before touching the member', async () => {
  const target = member('target', { timeout: async () => assert.fail('should not time out') });
  for (const ms of [null, 29 * 86400000]) {
    const message = fakeMessage({ target });
    await moderation.timeout(message, { id: 'target', username: 'target' }, ms, 'reason');
    assert.match(message.replies[0], /28 days at most/);
  }
});

test('nickname enforces the 32 character limit for both & and /', async () => {
  const target = member('target', { setNickname: async () => assert.fail('should not rename') });
  const message = fakeMessage({ target });
  await moderation.nickname(message, { id: 'target', username: 'target' }, 'x'.repeat(33));
  assert.match(message.replies[0], /32 characters at most/);
});

test('moderators cannot target someone at or above their own role', async () => {
  const target = member('target', { roles: { highest: { position: 5 } }, isCommunicationDisabled: () => true });
  const message = fakeMessage({ target });
  await moderation.untimeout(message, { id: 'target', username: 'target' });
  assert.match(message.replies[0], /equal or higher role/);
});

test('editPermission rejects unknown permissions and states', async () => {
  const target = member('target');
  const bad = [{ flag: undefined, state: 'allow', expect: /isn't a permission/ }, { flag: 'SendMessages', state: 'maybe', expect: /allow`, `deny` or `reset/ }];
  for (const { flag, state, expect } of bad) {
    const message = fakeMessage({ target });
    await moderation.editPermission(message, { id: 'target', flag, state });
    assert.match(message.replies[0], expect);
  }
});
