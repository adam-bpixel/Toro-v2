'use strict';
const { Events } = require('discord.js');
const { giveAutoRoles } = require('../handlers/roles/autoroleSetup');
const { updateMemberTag } = require('../handlers/roles/autotagSetup');
const { updateCounter } = require('../handlers/setup/counters');
const { sendWelcomer } = require('../handlers/setup/welcomerSetup');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    try {
      await giveAutoRoles(member);
    } catch (error) {
      console.error(`Auto roles failed for ${member.user.tag} in ${member.guild.name}:`, error);
    }
    await updateMemberTag(member).catch(() => {});
    updateCounter(member.guild, 'members').catch(() => {});
    sendWelcomer(member).catch((error) => console.error(`Welcomer failed for ${member.user.tag}:`, error.message));
  },
};
