const { PermissionFlagsBits } = require('discord.js');
const { notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'set-rolecoleader',
  aliases: [],
  description: 'Set clan co-leader role',
  usage: '<@role|roleID|rolename>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'Set the role clan co-leaders receive',
        usage: '&set-rolecoleader <@role|roleID|rolename>',
        notes: ['Requires the Manage Server permission'],
      });
    }
    return clans.configureSetupRole(message, 'coleader', args.join(' '));
  },
};
