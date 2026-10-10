'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../core/db');
const { updateGuildConfig } = require('../core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');

const LIMITS = { self: 5, server: 30 };
const guildConfigs = () => getDb().collection('guildConfig');
const cache = new Map();

async function configOf(guildId) {
  if (!cache.has(guildId)) {
    const found = await guildConfigs().findOne({ guildId }, { projection: { noPrefixServer: 1, noPrefixSelf: 1 } });
    const self = new Map(Object.entries((found && found.noPrefixSelf) || {}).map(([id, names]) => [id, new Set(names)]));
    cache.set(guildId, { server: new Set((found && found.noPrefixServer) || []), self });
  }
  return cache.get(guildId);
}

const BUILTIN = { a: 'avatar', b: 'banner', r: 'rank', p: 'profile', d: 'daily', u: 'user', ms7: 'clear' };
const BUILTIN_TARGET = /^(?:<@!?\d+>|\d{15,25})$/;

const HIDDEN = ['avatar', 'banner', 'server', 'user', 'daily'];
const TAKES_NO_ARGUMENT = new Set(['daily', 'server']);
const TAKES_AMOUNT = new Set(['clear']);

function isBuiltin(client, content) {
  const [word, ...rest] = content.trim().split(/\s+/);
  const key = String(word).toLowerCase();
  const name = BUILTIN[key] || (HIDDEN.includes(key) ? key : null);
  if (!name || !client.commands.has(name)) return false;
  if (rest.length === 0) return true;
  if (TAKES_NO_ARGUMENT.has(name)) return false;
  if (TAKES_AMOUNT.has(name)) return rest.length === 1 && /^\d{1,3}$/.test(rest[0]);
  return rest.length === 1 && BUILTIN_TARGET.test(rest[0]);
}

async function allowed(guildId, userId, name) {
  const config = await configOf(guildId);
  return config.server.has(name) || Boolean(config.self.get(userId) && config.self.get(userId).has(name));
}

const scopeField = (scope, userId) => (scope === 'server' ? 'noPrefixServer' : `noPrefixSelf.${userId}`);
const namesOf = (config, scope, userId) => (scope === 'server' ? config.server : (config.self.get(userId) || new Set()));

const resolveCommand = (client, word) => {
  const name = String(word || '').toLowerCase();
  const command = client.commands.get(name) || client.commands.get(client.aliases.get(name));
  return command ? command.name : null;
};

async function execute(message, args) {
  const scope = (args[0] || '').toLowerCase();
  const action = (args[1] || '').toLowerCase();
  if (!(scope in LIMITS) || !['add', 'remove', 'list'].includes(action) || (action !== 'list' && !args[2])) {
    return usageCard(message, {
      summary: 'Run commands without typing the prefix',
      usage: '&noprefix <self|server> <add|remove|list> [command]',
      notes: ['`self` : only you - up to 5 commands', '`server` : everyone in this server - up to 30 commands (needs Administrator)'],
    });
  }
  if (scope === 'server' && action !== 'list' && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return notice(message, "__You don't have permission__");
  }

  const guildId = message.guild.id;
  const userId = message.author.id;
  const title = scope === 'server' ? 'No Prefix - Server' : 'No Prefix - Self';
  const config = await configOf(guildId);
  const names = namesOf(config, scope, userId);
  const field = scopeField(scope, userId);

  if (action === 'list') {
    return card(message, {
      title,
      lines: [
        ...(names.size ? [...names].map((name) => `\`${name}\``) : ['__No commands yet__']),
        `__\`${names.size}/${LIMITS[scope]}\`__`,
        `__Built-in for everyone: ${Object.entries(BUILTIN).map(([word, name]) => `\`${word}\` = ${name}`).join(', ')}__`,
      ],
    });
  }

  const name = resolveCommand(message.client, args[2]);
  if (!name) return notice(message, "__That command doesn't exist__");

  if (action === 'add') {
    if (names.has(name)) return notice(message, `__\`${name}\` is already in the list__`);
    if (names.size >= LIMITS[scope]) return notice(message, `__You can have ${LIMITS[scope]} commands at most - remove one first__`);
    await updateGuildConfig(guildId, { $addToSet: { [field]: name } });
    names.add(name);
    if (scope === 'self' && !config.self.has(userId)) config.self.set(userId, names);
    return card(message, { title, lines: [`__\`${name}\` can now be used without a prefix__`, `__\`${names.size}/${LIMITS[scope]}\`__`] });
  }

  if (!names.has(name)) return notice(message, `__\`${name}\` is not in the list__`);
  await updateGuildConfig(guildId, { $pull: { [field]: name } });
  names.delete(name);
  return card(message, { title, lines: [`__\`${name}\` needs the prefix again__`, `__\`${names.size}/${LIMITS[scope]}\`__`] });
}

const serverNames = async (guildId) => [...(await configOf(guildId)).server].sort();

async function addServerCommand(client, guildId, word) {
  const name = resolveCommand(client, word);
  if (!name) return { error: "That command doesn't exist" };
  const names = (await configOf(guildId)).server;
  if (names.has(name)) return { error: `\`${name}\` is already in the list` };
  if (names.size >= LIMITS.server) return { error: `The server can have ${LIMITS.server} commands at most - remove one first` };
  await updateGuildConfig(guildId, { $addToSet: { noPrefixServer: name } });
  names.add(name);
  return { name, count: names.size };
}

async function removeServerCommands(guildId, removed) {
  const names = (await configOf(guildId)).server;
  const list = removed.filter((name) => names.has(name));
  if (list.length) await updateGuildConfig(guildId, { $pull: { noPrefixServer: { $in: list } } });
  list.forEach((name) => names.delete(name));
  return list;
}


module.exports = { allowed, isBuiltin, execute, resolveCommand, serverNames, addServerCommand, removeServerCommands, LIMITS };
