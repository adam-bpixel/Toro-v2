'use strict';
const { getDb } = require('../core/db');
const economy = require('./economy');

const profiles = () => getDb().collection('profiles');
const ownership = () => getDb().collection('profileOwnership');
const counters = () => getDb().collection('profileCounters');

async function nextProfileId() {
  const result = await counters().findOneAndUpdate(
    { _id: 'global' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return (result.value || result).seq;
}

async function createProfile(imageUrl) {
  const profileId = await nextProfileId();
  const profile = { profileId, imageUrl, name: null, price: null, stock: null, previewUrl: null, createdAt: new Date() };
  await profiles().insertOne(profile);
  return profile;
}

const getProfile = (profileId) => profiles().findOne({ profileId });

const listProfiles = () => profiles().find().sort({ profileId: 1 }).toArray();

const setPreviewUrl = (profileId, previewUrl) => profiles().updateOne({ profileId }, { $set: { previewUrl } });

async function setShopListing(profileId, { name, price, stock }) {
  const result = await profiles().updateOne({ profileId }, { $set: { name, price, stock } });
  return result.matchedCount === 1;
}

async function updateShopField(profileId, field, value) {
  const result = await profiles().updateOne({ profileId }, { $set: { [field]: value } });
  return result.matchedCount === 1;
}

const removeShopListing = (profileId) => setShopListing(profileId, { name: null, price: null, stock: null });

const ownsProfile = async (userId, profileId) => Boolean(await ownership().findOne({ userId, profileId }));

const shopListings = () => profiles().find({ name: { $ne: null } }).sort({ profileId: 1 }).toArray();

async function takeStock(profileId) {
  const profile = await profiles().findOne({ profileId });
  if (!profile || profile.name === null) return false;
  if (profile.stock === -1) return true;
  if (!(profile.stock > 0)) return false;
  const result = await profiles().updateOne({ profileId, stock: profile.stock }, { $inc: { stock: -1 } });
  return result.matchedCount === 1;
}

async function refundStock(profileId) {
  await profiles().updateOne({ profileId, stock: { $gte: 0 } }, { $inc: { stock: 1 } });
}

async function giveProfile(userId, profileId) {
  await ownership().updateOne({ userId, profileId }, { $set: { userId, profileId, acquiredAt: new Date() } }, { upsert: true });
}

async function removeProfile(userId, profileId) {
  const result = await ownership().deleteOne({ userId, profileId });
  return result.deletedCount === 1;
}

async function ownedProfiles(userId) {
  const ids = (await ownership().find({ userId }).toArray()).map((entry) => entry.profileId);
  if (!ids.length) return [];
  return profiles().find({ profileId: { $in: ids } }).sort({ profileId: 1 }).toArray();
}

async function buyProfile(userId, profileId) {
  const profile = await getProfile(profileId);
  if (!profile || profile.name === null) return { ok: false, notice: '__That background is no longer in the shop__' };
  if (await ownsProfile(userId, profileId)) return { ok: false, notice: '__You already own that background__' };

  const balance = await economy.getBalance(userId);
  if (balance < profile.price) return { ok: false, notice: "__You don't have enough RVP for that__" };

  await economy.addBalance(userId, -profile.price);
  if (!(await takeStock(profileId))) {
    await economy.addBalance(userId, profile.price);
    return { ok: false, notice: '__That background just sold out__' };
  }

  await giveProfile(userId, profileId);
  await economy.setEquippedProfile(userId, profileId);
  return { ok: true, profile };
}

module.exports = {
  createProfile,
  getProfile,
  listProfiles,
  setPreviewUrl,
  setShopListing,
  updateShopField,
  removeShopListing,
  shopListings,
  takeStock,
  refundStock,
  ownsProfile,
  giveProfile,
  removeProfile,
  ownedProfiles,
  buyProfile,
};
