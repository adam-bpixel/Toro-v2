const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { notice, usageCard } = require('../../utils/render/embeds');
const moderation = require('../../services/moderation');

module.exports = {
  name: 'nickname',
  aliases: ['nick', 'setnick'],
  description: "Change a member's nickname",
  usage: '<ID|@member|username> [nickname]',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: "Change a member's nickname",
        usage: '&nickname <ID|@member|username> [nickname]',
        notes: ['Leave the nickname out to reset it', 'Max 32 characters'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    return moderation.nickname(message, target, args.slice(1).join(' '));
  },
};
