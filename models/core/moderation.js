'use strict';
const { getDb } = require('./db');

const guildConfigs = () => getDb().collection('guildConfig');
const jailLogs = () => getDb().collection('jailLogs');
const alertLogs = () => getDb().collection('alertLogs');
const warnings = () => getDb().collection('warnings');

const configCache = new Map();
function invalidateGuildConfig(guildId) {
  configCache.delete(guildId);
}

async function getGuildConfig(guildId) {
  if (configCache.has(guildId)) return configCache.get(guildId);
  const found = await guildConfigs().findOneAndUpdate(
    { guildId },
    {
      $setOnInsert: {
        guildId,
        jailRoleId: null,
        jailerRoleIds: [],
        ticketCategoryId: null,
        ticketLogChannelId: null,
        ticketPanelChannelId: null,
        ticketPanelStyle: null,
        ticketPanelImageURL: null,
        ticketCounter: 0,
        applyPanelChannelId: null,
        applyReviewChannelId: null,
        applyPanelStyle: null,
        applyPanelImageURL: null,
        autoRoleIds: [],
        levelRoles: [],
        levelBypassIds: [],
      },
    },
    { upsert: true, returnDocument: 'after' },
  );
  const config = found.value || found;
  configCache.set(guildId, config);
  return config;
}

async function nextTicketNumber(guildId) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().findOneAndUpdate(
    { guildId },
    { $inc: { ticketCounter: 1 } },
    { returnDocument: 'after' },
  );
  invalidateGuildConfig(guildId);
  return (result.value || result).ticketCounter;
}

const TICKET_FIELD_MAP = {
  categoryId: 'ticketCategoryId',
  logChannelId: 'ticketLogChannelId',
  panelChannelId: 'ticketPanelChannelId',
  panelStyle: 'ticketPanelStyle',
  panelImageURL: 'ticketPanelImageURL',
  panelMessageId: 'ticketPanelMessageId',
};

async function patchTicketConfig(guildId, patch) {
  await getGuildConfig(guildId);
  const set = {};
  for (const [key, value] of Object.entries(patch)) {
    if (TICKET_FIELD_MAP[key]) set[TICKET_FIELD_MAP[key]] = value;
  }
  if (Object.keys(set).length) {
    await guildConfigs().updateOne({ guildId }, { $set: set });
    invalidateGuildConfig(guildId);
  }
}

const APPLY_FIELD_MAP = {
  panelChannelId: 'applyPanelChannelId',
  reviewChannelId: 'applyReviewChannelId',
  panelStyle: 'applyPanelStyle',
  panelImageURL: 'applyPanelImageURL',
  panelMessageId: 'applyPanelMessageId',
};

async function patchApplyConfig(guildId, patch) {
  await getGuildConfig(guildId);
  const set = {};
  for (const [key, value] of Object.entries(patch)) {
    if (APPLY_FIELD_MAP[key]) set[APPLY_FIELD_MAP[key]] = value;
  }
  if (Object.keys(set).length) {
    await guildConfigs().updateOne({ guildId }, { $set: set });
    invalidateGuildConfig(guildId);
  }
}

const CLAIM_PANEL_FIELD_MAP = {
  channelId: 'claimPanelChannelId',
  messageId: 'claimPanelMessageId',
};

async function patchClaimPanel(guildId, patch) {
  await getGuildConfig(guildId);
  const set = {};
  for (const [key, value] of Object.entries(patch)) {
    if (CLAIM_PANEL_FIELD_MAP[key]) set[CLAIM_PANEL_FIELD_MAP[key]] = value;
  }
  if (Object.keys(set).length) {
    await guildConfigs().updateOne({ guildId }, { $set: set });
    invalidateGuildConfig(guildId);
  }
}

async function setLevelRoles(guildId, { levelRoles, levelBypassIds }) {
  await getGuildConfig(guildId);
  const set = {};
  if (levelRoles) set.levelRoles = levelRoles;
  if (levelBypassIds) set.levelBypassIds = levelBypassIds;
  await guildConfigs().updateOne({ guildId }, { $set: set });
  invalidateGuildConfig(guildId);
}

async function setLogChannel(guildId, category, channelId) {
  await getGuildConfig(guildId);
  const field = `logChannels.${category}`;
  const off = `logDisabled.${category}`;
  await guildConfigs().updateOne({ guildId }, channelId ? { $set: { [field]: channelId }, $unset: { [off]: '' } } : { $unset: { [field]: '', [off]: '' } });
  invalidateGuildConfig(guildId);
}

async function setLogEnabled(guildId, event, enabled) {
  await getGuildConfig(guildId);
  const field = `logDisabled.${event}`;
  await guildConfigs().updateOne({ guildId }, enabled ? { $unset: { [field]: '' } } : { $set: { [field]: true } });
  invalidateGuildConfig(guildId);
}

async function setAutoRoles(guildId, roleIds) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { autoRoleIds: roleIds } });
  invalidateGuildConfig(guildId);
}

async function getRoleRequestConfig(guildId) {
  const stored = (await getGuildConfig(guildId)).roleRequest || {};
  return {
    panelChannelId: stored.panelChannelId || null,
    reviewChannelId: stored.reviewChannelId || null,
    panelStyle: stored.panelStyle || 'button',
    panelImageURL: stored.panelImageURL || null,
    panelMessageId: stored.panelMessageId || null,
    categories: Array.isArray(stored.categories) ? stored.categories : [],
  };
}

async function getSuggestConfig(guildId) {
  const stored = (await getGuildConfig(guildId)).suggest || {};
  return {
    panelChannelId: stored.panelChannelId || null,
    reviewChannelId: stored.reviewChannelId || null,
    panelMessageId: stored.panelMessageId || null,
  };
}

async function updateGuildConfig(guildId, update, filter = {}) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().updateOne({ guildId, ...filter }, update);
  invalidateGuildConfig(guildId);
  return result;
}

async function getGuildPrefix(guildId) {
  const found = await guildConfigs().findOne({ guildId }, { projection: { prefix: 1 } });
  return (found && found.prefix) || null;
}

async function setGuildPrefix(guildId, prefix) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { prefix } });
  invalidateGuildConfig(guildId);
}

async function getUserPrefix(userId) {
  const found = await getDb().collection('userPrefixes').findOne({ userId }, { projection: { prefix: 1 } });
  return (found && found.prefix) || null;
}

async function setUserPrefix(userId, prefix) {
  const collection = getDb().collection('userPrefixes');
  if (prefix) await collection.updateOne({ userId }, { $set: { prefix } }, { upsert: true });
  else await collection.deleteOne({ userId });
}

async function getClaimCategories(guildId) {
  const config = await getGuildConfig(guildId);
  return Array.isArray(config.claimCategories) ? config.claimCategories : [];
}

async function addClaimCategory(guildId, category, max) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().updateOne(
    { guildId, [`claimCategories.${max - 1}`]: { $exists: false } },
    { $push: { claimCategories: category } },
  );
  invalidateGuildConfig(guildId);
  return result.modifiedCount === 1;
}

async function addClaimRole(guildId, categoryId, role, max) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().updateOne(
    {
      guildId,
      claimCategories: {
        $elemMatch: { id: categoryId, [`roles.${max - 1}`]: { $exists: false }, 'roles.id': { $ne: role.id } },
      },
    },
    { $push: { 'claimCategories.$.roles': role } },
  );
  invalidateGuildConfig(guildId);
  return result.modifiedCount === 1;
}

async function removeClaimRole(guildId, categoryId, roleId) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().updateOne(
    { guildId, claimCategories: { $elemMatch: { id: categoryId, 'roles.id': roleId } } },
    { $pull: { 'claimCategories.$.roles': { id: roleId } } },
  );
  invalidateGuildConfig(guildId);
  return result.modifiedCount === 1;
}

async function updateClaimCategory(guildId, categoryId, { name, imageUrl }) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().updateOne(
    { guildId, 'claimCategories.id': categoryId },
    { $set: { 'claimCategories.$.name': name, 'claimCategories.$.imageUrl': imageUrl } },
  );
  invalidateGuildConfig(guildId);
  return result.matchedCount === 1;
}

async function removeClaimCategory(guildId, categoryId) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().updateOne(
    { guildId, 'claimCategories.id': categoryId },
    { $pull: { claimCategories: { id: categoryId } } },
  );
  invalidateGuildConfig(guildId);
  return result.modifiedCount === 1;
}

async function setJailRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { jailRoleId: roleId } });
  invalidateGuildConfig(guildId);
}

async function addJailerRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $addToSet: { jailerRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function removeJailerRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $pull: { jailerRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function addMuterRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $addToSet: { muterRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function removeMuterRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $pull: { muterRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function addVerificatorRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $addToSet: { verificatorRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function removeVerificatorRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $pull: { verificatorRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function setCounter(guildId, kind, { channelId, format }) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { [`counters.${kind}`]: { channelId, format } } });
  invalidateGuildConfig(guildId);
}

async function removeCounter(guildId, kind) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $unset: { [`counters.${kind}`]: '' } });
  invalidateGuildConfig(guildId);
}

async function getCommandRestriction(guildId, commandName) {
  const config = await getGuildConfig(guildId);
  const stored = (config.commandRestrictions || {})[commandName] || {};
  return {
    disabledGlobally: Boolean(stored.disabledGlobally),
    disabledChannelIds: Array.isArray(stored.disabledChannelIds) ? stored.disabledChannelIds : [],
    allowedChannelIds: Array.isArray(stored.allowedChannelIds) ? stored.allowedChannelIds : [],
  };
}

async function setCommandRestriction(guildId, commandName, restriction) {
  await getGuildConfig(guildId);
  const empty = !restriction.disabledGlobally && !restriction.disabledChannelIds.length && !restriction.allowedChannelIds.length;
  if (empty) await guildConfigs().updateOne({ guildId }, { $unset: { [`commandRestrictions.${commandName}`]: '' } });
  else await guildConfigs().updateOne({ guildId }, { $set: { [`commandRestrictions.${commandName}`]: restriction } });
  invalidateGuildConfig(guildId);
}

function isCommandRestricted(config, commandName, channelId) {
  const restriction = (config.commandRestrictions || {})[commandName];
  if (!restriction) return false;
  if (restriction.disabledGlobally) return !(restriction.allowedChannelIds || []).includes(channelId);
  return (restriction.disabledChannelIds || []).includes(channelId);
}

async function setAzkarConfig(guildId, { channelId, intervalHours }) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { azkar: { channelId, intervalHours, lastSentAt: null } } });
  invalidateGuildConfig(guildId);
}

async function removeAzkarConfig(guildId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $unset: { azkar: '' } });
  invalidateGuildConfig(guildId);
}

async function setAzkarLastSent(guildId, when) {
  await guildConfigs().updateOne({ guildId }, { $set: { 'azkar.lastSentAt': when } });
  invalidateGuildConfig(guildId);
}

async function getAllAzkarConfigs() {
  const docs = await guildConfigs().find({ 'azkar.channelId': { $exists: true } }, { projection: { guildId: 1, azkar: 1 } }).toArray();
  return docs.map((d) => ({ guildId: d.guildId, ...d.azkar }));
}

async function setClearSkipChannels(guildId, channelIds) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { clearSkipChannelIds: channelIds } });
  invalidateGuildConfig(guildId);
}

async function logJailAction(guildId, userId, action, reason, moderatorId) {
  await jailLogs().insertOne({ guildId, userId, action, reason: reason || 'No reason provided', moderatorId, createdAt: new Date() });
}

async function getJailActionLogs(guildId, userId, action) {
  return jailLogs().find({ guildId, userId, action }).sort({ createdAt: -1 }).toArray();
}

const ALERT_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const randomAlertId = () => Array.from({ length: 6 }, () => ALERT_ID_CHARS[Math.floor(Math.random() * ALERT_ID_CHARS.length)]).join('');

async function logAlert(guildId, userId, reason, moderatorId) {
  const alertId = randomAlertId();
  await alertLogs().insertOne({ guildId, userId, alertId, reason, moderatorId, createdAt: new Date() });
  return alertId;
}

async function getAlertLogs(guildId, userId) {
  return alertLogs().find({ guildId, userId }).sort({ createdAt: -1 }).toArray();
}

async function clearWarnings(guildId, userId) {
  const result = await warnings().deleteMany({ guildId, userId });
  return result.deletedCount;
}

module.exports = {
  getGuildConfig,
  invalidateGuildConfig,
  nextTicketNumber,
  patchTicketConfig,
  patchApplyConfig,
  patchClaimPanel,
  setAutoRoles,
  setLevelRoles,
  setLogChannel,
  setLogEnabled,
  getRoleRequestConfig,
  getSuggestConfig,
  updateGuildConfig,
  getGuildPrefix,
  setGuildPrefix,
  getUserPrefix,
  setUserPrefix,
  getClaimCategories,
  addClaimCategory,
  addClaimRole,
  removeClaimRole,
  updateClaimCategory,
  removeClaimCategory,
  setJailRole,
  addJailerRole,
  removeJailerRole,
  addMuterRole,
  removeMuterRole,
  addVerificatorRole,
  removeVerificatorRole,
  setCounter,
  removeCounter,
  getCommandRestriction,
  setCommandRestriction,
  isCommandRestricted,
  setAzkarConfig,
  removeAzkarConfig,
  setAzkarLastSent,
  getAllAzkarConfigs,
  setClearSkipChannels,
  logJailAction,
  getJailActionLogs,
  logAlert,
  getAlertLogs,
  clearWarnings,
};
