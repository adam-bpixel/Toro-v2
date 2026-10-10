const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { card, notice, usageCard } = require('../../utils/render/embeds');

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
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");
    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    if (!member.isCommunicationDisabled()) return notice(message, '__That member is not timed out__');

    const done = await member.timeout(null).then(() => true).catch(() => false);
    if (!done) return notice(message, "__Couldn't remove that timeout__");
    await card(message, { title: 'Command', lines: [`__Removed the timeout of__ **${target.username}**`] });
  },
};
