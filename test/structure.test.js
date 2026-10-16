'use strict';
// Checks that need no Discord connection and no database: every file loads, every name is
// unique, every slash command points at something that exists, and no two interaction routes
// fight over the same customId. Run with `npm test` before every commit.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const loader = require('../utils/runtime/loader');

const ROOT = path.join(__dirname, '..');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : walk(full);
  return entry.name.endsWith('.js') ? [full] : [];
});
const sourceFiles = walk(ROOT);

function loadClient() {
  const client = { commands: new Collection(), aliases: new Collection() };
  loader.loadCommands(client);
  return client;
}

test('every prefix command loads, with unique names and aliases', () => {
  const client = loadClient();
  assert.ok(client.commands.size > 100, `only ${client.commands.size} commands loaded`);
  for (const [alias, target] of client.aliases) assert.ok(client.commands.has(target), `alias "${alias}" points at missing "${target}"`);
});

// The limits Discord enforces on application command JSON; breaking one fails deploy-commands.
function checkCommandJson(where, data) {
  const NAME = /^[-_\p{Ll}\p{Lo}\p{N}]{1,32}$/u;
  const checkOption = (at, option) => {
    assert.match(option.name, NAME, `${at}: bad option name "${option.name}"`);
    assert.ok(option.description && option.description.length <= 100, `${at} ${option.name}: description must be 1-100 characters`);
    assert.ok(!option.choices || option.choices.length <= 25, `${at} ${option.name}: more than 25 choices`);
    const children = option.options || [];
    assert.ok(children.length <= 25, `${at} ${option.name}: more than 25 options`);
    let optionalSeen = false;
    for (const child of children) {
      if (child.type > 2 && !child.required) optionalSeen = true;
      else if (child.type > 2 && optionalSeen) assert.fail(`${at} ${option.name}: required option "${child.name}" comes after an optional one`);
      checkOption(`${at} ${option.name}`, child);
    }
  };
  checkOption(where, { ...data, type: 1 });
}

test('every slash command is valid and routes to a handler that exists', () => {
  const client = loadClient();
  const { natives } = require('../handlers/slashRuntime');
  for (const [name, slash] of loader.loadSlashCommands()) {
    checkCommandJson(`/${name}`, slash.data);
    for (const [sub, , , handler] of slash.rows || []) {
      const at = `/${name}${sub ? ` ${sub}` : ''}`;
      if (!handler) continue;
      if (handler.native) assert.equal(typeof natives[handler.native], 'function', `${at}: no native handler "${handler.native}"`);
      if (handler.command) assert.ok(client.commands.has(handler.command), `${at}: prefix command "${handler.command}" does not exist`);
    }
  }
});

// Every customId-looking string in the code, with the shared `${ID}` suffix filled in.
function knownCustomIds() {
  const ids = new Set();
  const ID = '1398395532103254157';
  const literal = /(['"`])([a-z][a-z0-9]*(?:[_:][a-z0-9]+|_\$\{ID\})+_?)\1/g;
  for (const file of sourceFiles) {
    // eslint-disable-next-line no-template-curly-in-string -- the literal source text `${ID}` is what we replace
    for (const [, , text] of fs.readFileSync(file, 'utf8').matchAll(literal)) ids.add(text.replace('${ID}', ID));
  }
  for (const id of require('../commands/setup/setup').buttonIds) ids.add(id);
  return ids;
}

function fakeInteraction(customId, kind) {
  const yes = {
    button: ['isButton', 'isMessageComponent', 'isRepliable'],
    select: ['isStringSelectMenu', 'isAnySelectMenu', 'isMessageComponent', 'isRepliable'],
    modal: ['isModalSubmit', 'isRepliable'],
  }[kind];
  return new Proxy({ customId }, {
    get(target, key) {
      if (key in target) return target[key];
      if (typeof key === 'string' && key.startsWith('is')) return () => yes.includes(key);
      return undefined;
    },
  });
}

test('no customId is claimed by two interaction routes', () => {
  const { routes } = require('../handlers/interactionRouter');
  assert.ok(routes.length > 20, `only ${routes.length} routes loaded`);
  const clashes = [];
  for (const id of knownCustomIds()) {
    for (const kind of ['button', 'select', 'modal']) {
      const hits = routes.filter((route) => route.match(fakeInteraction(id, kind))).map((route) => route.name);
      if (hits.length > 1) clashes.push(`${kind} "${id}" -> ${hits.join(', ')}`);
    }
  }
  assert.deepEqual(clashes, []);
});

test('every &setup button is answered by an interaction route', () => {
  const { routes } = require('../handlers/interactionRouter');
  const setup = require('../commands/setup/setup');
  const unrouted = setup.buttonIds.filter((id) => !routes.some((route) => route.match(fakeInteraction(id, 'button'))));
  assert.deepEqual(unrouted, [], 'add a route in handlers/<feature>/index.js for these buttons');
  // Each page button also needs a transition, or replay would show it disabled.
  const recorded = new Set(setup.recorded.flow.transitions.map((t) => t.custom_id));
  assert.deepEqual(setup.buttonIds.filter((id) => !recorded.has(id)), []);
});

test('files referenced with path.join(__dirname, ...) exist', () => {
  // Written by the bot at runtime, so they may be missing on a fresh checkout.
  const generated = new Set(['data/emoji-map.json']);
  const missing = [];
  const call = /path\.join\(__dirname((?:\s*,\s*'[^']*')+)\)/g;
  for (const file of sourceFiles) {
    for (const [, args] of fs.readFileSync(file, 'utf8').matchAll(call)) {
      const parts = [...args.matchAll(/'([^']*)'/g)].map((m) => m[1]);
      const target = path.join(path.dirname(file), ...parts);
      const shown = path.relative(ROOT, target).split(path.sep).join('/');
      if (!fs.existsSync(target) && !generated.has(shown)) missing.push(`${path.relative(ROOT, file)} -> ${shown}`);
    }
  }
  assert.deepEqual(missing, []);
});
