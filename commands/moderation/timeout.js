const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { parseDuration } = require('../../utils/format');
const { notice, usageCard } = require('../../utils/render/embeds');
const moderation = require('../../services/moderation');

module.exports = {
  name: 'timeout',
  aliases: [],
  description: 'Timeout a member',
  usage: '<ID|@member|username> <duration> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 3) {
      return usageCard(message, {
        summary: 'Timeout a member',
        usage: '&timeout <ID|@member|username> <duration> <reason>',
        notes: ['The reason is required for this action', 'Duration like `10m`, `2h` or `1d` (28 days at most)'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    return moderation.timeout(message, target, parseDuration(args[1]), args.slice(2).join(' '));
  },
};
