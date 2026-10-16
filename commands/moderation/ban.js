const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { notice, usageCard } = require('../../utils/render/embeds');
const moderation = require('../../services/moderation');

module.exports = {
  name: 'ban',
  aliases: [],
  description: 'Ban a member from the server',
  usage: '<ID|@member|username> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Ban a member from the server',
        usage: '&ban <ID|@member|username> <reason>',
        notes: ['The reason is required for this action', 'Cooldown: 10 seconds'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    return moderation.ban(message, target, { reason: args.slice(1).join(' ') });
  },
};
