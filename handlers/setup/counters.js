'use strict';
const { getGuildConfig } = require('../../models/core/moderation');

const COOLDOWN_MS = 10 * 60 * 1000;
const state = new Map();

const countOf = (guild, kind) => (kind === 'members' ? guild.memberCount : guild.voiceStates.cache.filter((s) => s.channelId).size);

async function renameNow(guild, kind) {
  const config = await getGuildConfig(guild.id);
  const settings = (config.counters || {})[kind];
  if (!settings) return;
  const channel = guild.channels.cache.get(settings.channelId);
  if (!channel) return;
  const name = settings.format.replace(/\{count\}/g, String(countOf(guild, kind)));
  if (channel.name === name) return;
  await channel.setName(name, 'Counter update').catch(() => {});
}

async function updateCounter(guild, kind) {
  const key = `${guild.id}:${kind}`;
  const entry = state.get(key) || { lastRenamedAt: 0, timer: null };
  if (entry.timer) return;
  const elapsed = Date.now() - entry.lastRenamedAt;
  if (elapsed >= COOLDOWN_MS) {
    entry.lastRenamedAt = Date.now();
    state.set(key, entry);
    return renameNow(guild, kind);
  }
  entry.timer = setTimeout(() => {
    entry.timer = null;
    entry.lastRenamedAt = Date.now();
    renameNow(guild, kind).catch(() => {});
  }, COOLDOWN_MS - elapsed);
  entry.timer.unref();
  state.set(key, entry);
}

module.exports = { updateCounter };
