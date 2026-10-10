'use strict';
const { getDb } = require('../core/db');

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_BASE_REWARD = 500;
const DAILY_STREAK_BONUS = 50;
const DAILY_STREAK_CAP = 20;
const DAILY_STREAK_GRACE_MS = 48 * 60 * 60 * 1000;

const XP_MIN_PER_MESSAGE = 15;
const XP_MAX_PER_MESSAGE = 25;
const XP_COOLDOWN_MS = 60 * 1000;
const MAX_DAILY_XP = 50000;

const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const users = () => getDb().collection('users');

function defaults(userId) {
  return {
    userId,
    balance: 0,
    dailyStreak: 0,
    lastDaily: null,
    totalXp: 0,
    dailyXp: 0,
    dailyXpDate: todayKey(),
    lastXpAt: null,
    commandCount: 0,
    messageCount: 0,
    voiceMs: 0,
    avatarShape: 'circle',
    equippedProfileId: null,
    boostMultiplier: null,
    boostExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const userCache = new Map();
function invalidateUser(userId) {
  userCache.delete(userId);
}

async function getUser(userId) {
  if (userCache.has(userId)) return userCache.get(userId);
  const found = await users().findOneAndUpdate(
    { userId },
    { $setOnInsert: defaults(userId) },
    { upsert: true, returnDocument: 'after' },
  );
  const user = found.value || found;
  userCache.set(userId, user);
  return user;
}

const xpForLevel = (level) => Math.floor(100 * Math.pow(level + 1, 1.5));

function levelFromTotalXp(totalXp) {
  let level = 0;
  let remaining = Math.max(0, Math.trunc(totalXp));
  let needed = xpForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return { level, levelXp: remaining, xpNeeded: needed };
}

async function addBalance(userId, delta) {
  await getUser(userId);
  const result = await users().findOneAndUpdate(
    { userId },
    { $inc: { balance: delta }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  invalidateUser(userId);
  return (result.value || result).balance;
}

async function getBalance(userId) {
  const user = await getUser(userId);
  return user.balance;
}

async function claimDaily(userId) {
  const user = await getUser(userId);
  const now = Date.now();
  const last = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;
  const elapsed = now - last;
  if (last && elapsed < DAILY_COOLDOWN_MS) {
    return { ok: false, remainingMs: DAILY_COOLDOWN_MS - elapsed };
  }
  const keptStreak = last && elapsed <= DAILY_STREAK_GRACE_MS ? user.dailyStreak : 0;
  const streak = Math.min(keptStreak + 1, DAILY_STREAK_CAP);
  const amount = DAILY_BASE_REWARD + streak * DAILY_STREAK_BONUS;
  await users().updateOne(
    { userId },
    { $inc: { balance: amount }, $set: { dailyStreak: streak, lastDaily: new Date(now), updatedAt: new Date(now) } },
  );
  invalidateUser(userId);
  const balance = await getBalance(userId);
  return { ok: true, amount, streak, balance };
}

async function getActiveCard(userId) {
  const user = await getUser(userId);
  if (!user.boostMultiplier || !user.boostExpiresAt || new Date(user.boostExpiresAt).getTime() <= Date.now()) return null;
  return { multiplier: user.boostMultiplier, expiresAt: new Date(user.boostExpiresAt) };
}

async function giveCardBoost(userId, multiplier, durationMs) {
  await getUser(userId);
  const expiresAt = new Date(Date.now() + durationMs);
  await users().updateOne({ userId }, { $set: { boostMultiplier: multiplier, boostExpiresAt: expiresAt, updatedAt: new Date() } });
  invalidateUser(userId);
  return { multiplier, expiresAt };
}

async function grantMessageXp(userId) {
  const user = await getUser(userId);
  const now = Date.now();
  if (user.lastXpAt && now - new Date(user.lastXpAt).getTime() < XP_COOLDOWN_MS) return null;

  const today = todayKey();
  const dailyXp = user.dailyXpDate === today ? user.dailyXp : 0;
  if (dailyXp >= MAX_DAILY_XP) {
    await users().updateOne({ userId }, { $set: { lastXpAt: new Date(now) } });
    invalidateUser(userId);
    return null;
  }

  const card = user.boostMultiplier && user.boostExpiresAt && new Date(user.boostExpiresAt).getTime() > now ? user.boostMultiplier : 1;
  const roll = Math.floor((Math.floor(Math.random() * (XP_MAX_PER_MESSAGE - XP_MIN_PER_MESSAGE + 1)) + XP_MIN_PER_MESSAGE) * card);
  const gained = Math.min(roll, MAX_DAILY_XP - dailyXp);
  const before = levelFromTotalXp(user.totalXp);
  const totalXp = user.totalXp + gained;
  const after = levelFromTotalXp(totalXp);

  await users().updateOne(
    { userId },
    {
      $set: {
        totalXp,
        dailyXp: dailyXp + gained,
        dailyXpDate: today,
        lastXpAt: new Date(now),
        updatedAt: new Date(now),
      },
    },
  );
  invalidateUser(userId);
  return { gained, leveledUp: after.level > before.level, level: after.level };
}

async function incrementCommandCount(userId) {
  await getUser(userId);
  await users().updateOne({ userId }, { $inc: { commandCount: 1 }, $set: { updatedAt: new Date() } });
  invalidateUser(userId);
}

async function incrementMessageCount(userId) {
  await getUser(userId);
  await users().updateOne({ userId }, { $inc: { messageCount: 1 }, $set: { updatedAt: new Date() } });
  invalidateUser(userId);
}

async function addVoiceMs(userId, ms) {
  if (ms <= 0) return;
  await getUser(userId);
  await users().updateOne({ userId }, { $inc: { voiceMs: ms }, $set: { updatedAt: new Date() } });
  invalidateUser(userId);
}

async function setAvatarShape(userId, shape) {
  await getUser(userId);
  await users().updateOne({ userId }, { $set: { avatarShape: shape, updatedAt: new Date() } });
  invalidateUser(userId);
}

async function setEquippedProfile(userId, profileId) {
  await getUser(userId);
  await users().updateOne({ userId }, { $set: { equippedProfileId: profileId, updatedAt: new Date() } });
  invalidateUser(userId);
}

async function getRank(userId) {
  const user = await getUser(userId);
  const higher = await users().countDocuments({ totalXp: { $gt: user.totalXp } });
  return higher + 1;
}

function dailyXpOf(user) {
  return user.dailyXpDate === todayKey() ? user.dailyXp : 0;
}

module.exports = {
  getUser,
  addBalance,
  getBalance,
  claimDaily,
  grantMessageXp,
  incrementCommandCount,
  incrementMessageCount,
  addVoiceMs,
  setAvatarShape,
  setEquippedProfile,
  getActiveCard,
  giveCardBoost,
  getRank,
  levelFromTotalXp,
  xpForLevel,
  dailyXpOf,
  MAX_DAILY_XP,
  DAILY_COOLDOWN_MS,
};
