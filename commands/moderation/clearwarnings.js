const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { clearWarnings } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');

module.exports = {
  name: 'clearwarnings',
  aliases: [],
  description: 'Clear all warnings for a user',
  usage: '<ID|@member|username>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'Clear warnings for a member',
        usage: '&clearwarnings <ID|@member|username>',
        notes: ['Requires Administrator permission'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");

    const cleared = await clearWarnings(message.guild.id, target.id);
    await card(message, { title: 'Command', lines: [`__Cleared__ \`${cleared}\` __warning(s) for__ **${target.username}**`] });
  },
};
