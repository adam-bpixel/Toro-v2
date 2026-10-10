'use strict';
const { Events } = require('discord.js');
const clans = require('../models/economy/clans');
const { updateCounter } = require('../handlers/setup/counters');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    try {
      await clans.handleMemberLeft(member);
    } catch (error) {
      console.error(`Clan cleanup failed for ${member.id} in ${member.guild.name}:`, error);
    }
    updateCounter(member.guild, 'members').catch(() => {});
  },
};
