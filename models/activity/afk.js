'use strict';
const afkUsers = new Map();

const setAfk = (userId, reason) => afkUsers.set(userId, { reason: reason || 'AFK', since: Date.now() });
const getAfk = (userId) => afkUsers.get(userId) || null;
function clearAfk(userId) {
  const data = afkUsers.get(userId);
  afkUsers.delete(userId);
  return data || null;
}

module.exports = { setAfk, getAfk, clearAfk };
