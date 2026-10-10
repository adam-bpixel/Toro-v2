const { PermissionFlagsBits } = require('discord.js');
const { card, notice, usageCard } = require('../../utils/render/embeds');

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

    const query = args[0].replace(/^@/, '').toLowerCase();
    const bans = await message.guild.bans.fetch().catch(() => null);
    if (!bans) return notice(message, "__Couldn't read the ban list (check my permissions)__");
    const ban = bans.get(args[0]) || bans.find((b) => b.user.username.toLowerCase() === query);
    if (!ban) return notice(message, '__That user is not banned__');

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const done = await message.guild.members.unban(ban.user.id, `${reason} (by ${message.author.username})`).then(() => true).catch(() => false);
    if (!done) return notice(message, "__Couldn't unban that user__");
    await card(message, { title: 'Command', lines: [`__Unbanned__ **${ban.user.username}**`, `__Reason__ : ${reason}`] });
  },
};
