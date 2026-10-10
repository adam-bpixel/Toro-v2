'use strict';
const { getDb } = require('../core/db');

const stats = () => getDb().collection('guildStats');
const add = (guildId, userId, inc) => stats().updateOne({ guildId, userId }, { $inc: inc, $set: { updatedAt: new Date() } }, { upsert: true });

const addMessage = (guildId, userId) => add(guildId, userId, { messages: 1 });
const addVoice = (guildId, userId, ms) => add(guildId, userId, { voiceMs: ms });

const top = (guildId, field, limit = 100) => stats().find({ guildId, [field]: { $gt: 0 } }).sort({ [field]: -1 }).limit(limit).toArray();

module.exports = { addMessage, addVoice, top };
