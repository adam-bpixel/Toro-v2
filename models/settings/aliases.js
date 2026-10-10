'use strict';
const { getDb } = require('../core/db');
const { isPremium } = require('../economy/premium');

const aliasDocs = () => getDb().collection('commandAliases');

const MAX_SERVER_PER_COMMAND = 3;
const MAX_PERSONAL = 5;
const COOLDOWN_MS = 30_000;
const ALIAS_PATTERN = /^[a-z0-9_-]{1,20}$/;

const cache = new Map();
async function aliasesOf(scope, id) {
  const key = `${scope}:${id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30_000) return hit.aliases;
  const doc = await aliasDocs().findOne({ scope, id });
  const aliases = (doc && doc.aliases) || {};
  cache.set(key, { at: Date.now(), aliases });
  return aliases;
}

async function resolve(guildId, userId, name) {
  if (!ALIAS_PATTERN.test(name)) return null;
  const personal = await aliasesOf('user', userId);
  if (personal[name] && (await isPremium('user', userId))) return personal[name];
  if (guildId) return (await aliasesOf('guild', guildId))[name] || null;
  return null;
}

const list = (scope, id) => aliasesOf(scope, id);

async function add(scope, id, alias, target, client) {
  alias = String(alias || '').toLowerCase();
  target = String(target || '').toLowerCase();
  if (!ALIAS_PATTERN.test(alias)) return { error: 'An alias is 1-20 letters, numbers, `-` or `_`' };
  if (client.commands.has(alias) || client.aliases.has(alias)) return { error: `\`${alias}\` is already a command` };
  const command = client.commands.get(target) || client.commands.get(client.aliases.get(target));
  if (!command) return { error: `There is no command called \`${target}\`` };

  const current = await aliasesOf(scope, id);
  if (current[alias]) return { error: `\`${alias}\` is already an alias of \`${current[alias]}\`` };
  if (scope === 'user') {
    if (Object.keys(current).length >= MAX_PERSONAL) return { error: `You can only have ${MAX_PERSONAL} personal aliases` };
  } else if (Object.values(current).filter((c) => c === command.name).length >= MAX_SERVER_PER_COMMAND) {
    return { error: `\`${command.name}\` already has ${MAX_SERVER_PER_COMMAND} aliases` };
  }
  await aliasDocs().updateOne({ scope, id }, { $set: { [`aliases.${alias}`]: command.name } }, { upsert: true });
  cache.delete(`${scope}:${id}`);
  return { command: command.name };
}

async function remove(scope, id, alias) {
  alias = String(alias || '').toLowerCase();
  const current = await aliasesOf(scope, id);
  if (!current[alias]) return { error: `\`${alias}\` is not one of the aliases` };
  await aliasDocs().updateOne({ scope, id }, { $unset: { [`aliases.${alias}`]: '' } });
  cache.delete(`${scope}:${id}`);
  return { command: current[alias] };
}

module.exports = { resolve, list, add, remove, MAX_SERVER_PER_COMMAND, MAX_PERSONAL, COOLDOWN_MS };
