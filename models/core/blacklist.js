'use strict';
const { getDb } = require('./db');

const blacklist = () => getDb().collection('blacklist');

let cache = new Map();
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  const docs = await blacklist().find().toArray();
  cache = new Map(docs.map((doc) => [doc._id, doc]));
  loaded = true;
}

const isBlacklisted = (userId) => cache.has(userId);
const getEntry = (userId) => cache.get(userId) || null;
const listBlacklist = () => [...cache.values()];

async function addToBlacklist(userId, reason, addedBy) {
  const entry = { reason: reason || 'No reason provided', addedBy, addedAt: new Date() };
  cache.set(userId, { _id: userId, ...entry });
  loaded = true;
  await blacklist().updateOne({ _id: userId }, { $set: entry }, { upsert: true });
}

async function removeFromBlacklist(userId) {
  cache.delete(userId);
  await blacklist().deleteOne({ _id: userId });
}

module.exports = { ensureLoaded, isBlacklisted, getEntry, listBlacklist, addToBlacklist, removeFromBlacklist };
