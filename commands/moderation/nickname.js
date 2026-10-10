const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { card, notice, usageCard } = require('../../utils/render/embeds');

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
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");
    if (target.id !== message.author.id) {
      const targetCheck = checkTarget(message, member);
      if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    }

    const nickname = args.slice(1).join(' ') || null;
    if (nickname && nickname.length > 32) return notice(message, '__The nickname can be 32 characters at most__');
    const done = await member.setNickname(nickname, `Changed by ${message.author.username}`).then(() => true).catch(() => false);
    if (!done) return notice(message, "__Couldn't change that nickname (check my role position/permissions)__");
    await card(message, {
      title: 'Command',
      lines: [nickname ? `__Changed the nickname of__ **${target.username}** __to__ **${nickname}**` : `__Reset the nickname of__ **${target.username}**`],
    });
  },
};
