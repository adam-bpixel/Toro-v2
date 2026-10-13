'use strict';
const { Events } = require('discord.js');
const { syncMemberOnRoleChange } = require('../handlers/roles/autotagSetup');
const { sendBoostNotification } = require('../handlers/setup/boostSetup');

module.exports = {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(oldMember, newMember) {
    if (!oldMember.premiumSince && newMember.premiumSince) {
      sendBoostNotification(newMember).catch((error) => console.error(`Boost notification failed for ${newMember.id}:`, error.message));
    }
    if (oldMember.roles.cache.size === newMember.roles.cache.size && oldMember.roles.cache.every((_, id) => newMember.roles.cache.has(id))) return;
    await syncMemberOnRoleChange(oldMember, newMember).catch((error) => console.error(`Auto tag failed for ${newMember.id}:`, error.message));
  },
};
