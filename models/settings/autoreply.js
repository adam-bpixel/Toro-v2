'use strict';
const { Events } = require('discord.js');
const { getDb } = require('../core/db');

const replies = () => getDb().collection('autoReplies');
const cache = new Map();
const cooldown = new Map();
const COOLDOWN_MS = 3000;
const MAX_PER_GUILD = 50;

const clean = (text) => String(text || '').trim().toLowerCase();

async function list(guildId) {
  if (!cache.has(guildId)) cache.set(guildId, await replies().find({ guildId }).sort({ createdAt: 1 }).toArray());
  return cache.get(guildId);
}

async function add(guildId, trigger, response) {
  const key = clean(trigger);
  if ((await list(guildId)).length >= MAX_PER_GUILD) return { error: `A server can have at most ${MAX_PER_GUILD} auto replies` };
  await replies().updateOne({ guildId, trigger: key }, { $set: { response, createdAt: new Date() }, $setOnInsert: { guildId, trigger: key } }, { upsert: true });
  cache.delete(guildId);
  return { trigger: key };
}

async function remove(guildId, trigger) {
  const result = await replies().deleteOne({ guildId, trigger: clean(trigger) });
  cache.delete(guildId);
  return result.deletedCount > 0;
}

function register(client) {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild || !message.content) return;
    const all = await list(message.guild.id).catch(() => []);
    const text = message.content.toLowerCase();
    const hit = all.find((entry) => text.includes(entry.trigger));
    if (!hit) return;
    const key = `${message.guild.id}:${hit.trigger}`;
    if (Date.now() - (cooldown.get(key) || 0) < COOLDOWN_MS) return;
    cooldown.set(key, Date.now());
    message.reply({ content: hit.response, allowedMentions: { parse: [], repliedUser: false } }).catch(() => {});
  });
}

module.exports = { register, list, add, remove, MAX_PER_GUILD };
