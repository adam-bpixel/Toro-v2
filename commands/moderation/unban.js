const { PermissionFlagsBits } = require('discord.js');
const { notice, usageCard } = require('../../utils/render/embeds');
const moderation = require('../../services/moderation');

module.exports = {
  name: 'unban',
  aliases: [],
  description: 'Unban a user from the server',
  usage: '<ID|username> [reason]',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'Unban a user from the server',
        usage: '&unban <ID|username> [reason]',
      });
    }
    return moderation.unban(message, args[0], args.slice(1).join(' '));
  },
};
