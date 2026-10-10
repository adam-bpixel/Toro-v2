'use strict';
const { Events } = require('discord.js');
const economy = require('../models/economy/economy');
const guildStats = require('../models/activity/guildStats');
const clans = require('../models/economy/clans');
const { updateCounter } = require('../handlers/setup/counters');

const voiceJoinedAt = new Map();

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    const userId = newState.id;
    const wasConnected = Boolean(oldState.channelId);
    const isConnected = Boolean(newState.channelId);
    if (!wasConnected && isConnected) {
      voiceJoinedAt.set(userId, Date.now());
    } else if (wasConnected && !isConnected) {
      const joinedAt = voiceJoinedAt.get(userId);
      voiceJoinedAt.delete(userId);
      if (joinedAt) {
        const spentMs = Date.now() - joinedAt;
        await economy.addVoiceMs(userId, spentMs).catch(() => {});
        await guildStats.addVoice(oldState.guild.id, userId, spentMs).catch(() => {});
      }
    }
    if (oldState.channelId !== newState.channelId) {
      if (oldState.channelId) await clans.endVoiceSession(newState.guild.id, userId).catch(() => {});
      if (newState.channelId) await clans.startVoiceSession(newState.guild.id, userId, newState.channelId).catch(() => {});
      updateCounter(newState.guild, 'voice').catch(() => {});
    }
  },
};
