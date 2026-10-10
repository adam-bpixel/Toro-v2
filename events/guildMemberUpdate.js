'use strict';
const { Events } = require('discord.js');
const { syncMemberOnRoleChange } = require('../handlers/roles/autotagSetup');

module.exports = {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(oldMember, newMember) {
    if (oldMember.roles.cache.size === newMember.roles.cache.size && oldMember.roles.cache.every((_, id) => newMember.roles.cache.has(id))) return;
    await syncMemberOnRoleChange(oldMember, newMember).catch((error) => console.error(`Auto tag failed for ${newMember.id}:`, error.message));
  },
};
