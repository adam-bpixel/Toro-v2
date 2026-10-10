'use strict';
const { Events } = require('discord.js');
const { getDb } = require('../core/db');
const { getGuildConfig, updateGuildConfig } = require('../core/moderation');

const warnings = () => getDb().collection('warnings');
const modActions = () => getDb().collection('modActions');

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomId = () => Array.from({ length: 6 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');

async function addWarning(guildId, userId, reason, moderatorId) {
  const warnId = randomId();
  await warnings().insertOne({ guildId, userId, warnId, reason, moderatorId, createdAt: new Date() });
  return { warnId, total: await warnings().countDocuments({ guildId, userId }) };
}

const getWarnings = (guildId, userId) => warnings().find({ guildId, userId }).sort({ createdAt: -1 }).toArray();

const MAXWARN_ACTIONS = ['timeout', 'kick', 'ban'];

async function getMaxWarn(guildId) {
  const stored = (await getGuildConfig(guildId)).maxWarn;
  return stored && stored.count ? stored : null;
}

const setMaxWarn = (guildId, value) =>
  updateGuildConfig(guildId, value ? { $set: { maxWarn: value } } : { $unset: { maxWarn: '' } });

const LIMIT_ACTIONS = ['ban', 'kick', 'warn', 'timeout'];
const today = () => new Date().toISOString().slice(0, 10);

async function getLimits(guildId) {
  const stored = (await getGuildConfig(guildId)).modLimits;
  return stored && typeof stored === 'object' ? stored : {};
}

async function setLimit(guildId, action, limit) {
  await updateGuildConfig(guildId, limit === null ? { $unset: { [`modLimits.${action}`]: '' } } : { $set: { [`modLimits.${action}`]: limit } });
}

async function limitReached(guildId, action) {
  const limit = (await getLimits(guildId))[action];
  if (!limit) return null;
  const row = await modActions().findOne({ guildId, action, day: today() });
  return (row ? row.count : 0) >= limit ? `__The daily limit for \`${action}\` (${limit}) has been reached__` : null;
}

const recordAction = (guildId, action) =>
  modActions().updateOne({ guildId, action, day: today() }, { $inc: { count: 1 } }, { upsert: true });

const SNIPE_KEEP = 50;
const SNIPE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const deleted = new Map();

function registerSnipe(client) {
  client.on(Events.MessageDelete, (message) => {
    if (!message.guild || !message.author || message.author.bot) return;
    const files = [...message.attachments.values()].map((a) => a.url);
    if (!message.content && !files.length) return;
    const list = deleted.get(message.channelId) || [];
    list.unshift({
      content: message.content || '',
      authorId: message.author.id,
      authorName: message.author.username,
      avatar: message.author.displayAvatarURL({ size: 128 }),
      files,
      at: Date.now(),
    });
    deleted.set(message.channelId, list.slice(0, SNIPE_KEEP));
  });
}

function getSniped(channelId) {
  const list = (deleted.get(channelId) || []).filter((entry) => Date.now() - entry.at < SNIPE_MAX_AGE_MS);
  if (list.length) deleted.set(channelId, list);
  else deleted.delete(channelId);
  return list;
}

module.exports = {
  addWarning,
  getWarnings,
  getMaxWarn,
  setMaxWarn,
  MAXWARN_ACTIONS,
  LIMIT_ACTIONS,
  getLimits,
  setLimit,
  limitReached,
  recordAction,
  registerSnipe,
  getSniped,
  SNIPE_KEEP,
};
