const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { notice, usageCard } = require('../../utils/render/embeds');
const moderation = require('../../services/moderation');

module.exports = {
  name: 'untimeout',
  aliases: [],
  description: 'Remove timeout from a member',
  usage: '<ID|@member|username>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'Remove timeout from a member',
        usage: '&untimeout <ID|@member|username>',
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    return moderation.untimeout(message, target);
  },
};
