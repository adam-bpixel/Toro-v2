'use strict';
const { getDb } = require('../core/db');

const premiums = () => getDb().collection('premium');
const KINDS = ['user', 'server'];

const ownerIds = () => (process.env.OWNER_ID || '').split(',').map((id) => id.trim()).filter(Boolean);
const isOwner = (userId) => ownerIds().includes(userId);

const DAY_MS = 86_400_000;
function parseDays(input) {
  const days = /^\d+$/.test(String(input || '').trim()) ? Number(input) : 0;
  return days > 0 && days <= 36_500 ? days * DAY_MS : null;
}
const isPermanent = (input) => ['permanent', 'lifetime', 'forever', 'perm'].includes(String(input || '').toLowerCase());

async function addPremium(kind, id, ms, addedBy) {
  const existing = await premiums().findOne({ kind, id });
  const running = existing && (!existing.expiresAt || existing.expiresAt > new Date());
  let expiresAt = null;
  if (ms !== null && !(running && !existing.expiresAt)) {
    const from = running ? existing.expiresAt.getTime() : Date.now();
    expiresAt = new Date(from + ms);
  }
  await premiums().updateOne({ kind, id }, { $set: { expiresAt, addedBy, updatedAt: new Date() }, $setOnInsert: { addedAt: new Date() } }, { upsert: true });
  cache.clear();
  return expiresAt;
}

const cache = new Map();
async function isPremium(kind, id) {
  if (!id) return false;
  const key = `${kind}:${id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.active;
  let active = false;
  try {
    const found = await premiums().findOne({ kind, id });
    active = Boolean(found && (!found.expiresAt || found.expiresAt > new Date()));
  } catch (error) {
    console.error(`Could not read premium of ${key}:`, error.message);
    return false;
  }
  cache.set(key, { at: Date.now(), active });
  return active;
}

async function getSubscription(kind, id) {
  const found = id && await premiums().findOne({ kind, id });
  return found && (!found.expiresAt || found.expiresAt > new Date()) ? { since: found.addedAt || found.updatedAt || null, expiresAt: found.expiresAt || null } : null;
}

const serverAllowed = async (message) => Boolean(message.guild) && isPremium('server', message.guild.id);

const canUsePersonalPrefix = async (userId) => isOwner(userId) || isPremium('user', userId);

module.exports = { KINDS, isOwner, parseDays, isPermanent, addPremium, isPremium, getSubscription, serverAllowed, canUsePersonalPrefix };
