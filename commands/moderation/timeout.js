const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { limitReached, recordAction } = require('../../models/enforcement/modTools');
const { parseDuration } = require('../../utils/format');
const { card, notice, usageCard } = require('../../utils/render/embeds');

const MAX_TIMEOUT_MS = 28 * 86400000;

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
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");
    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);

    const ms = parseDuration(args[1]);
    if (!ms || ms > MAX_TIMEOUT_MS) return notice(message, '__Give a duration like `10m`, `2h` or `1d` (28 days at most)__');

    const limit = await limitReached(message.guild.id, 'timeout');
    if (limit) return notice(message, limit);

    const reason = args.slice(2).join(' ');
    const done = await member.timeout(ms, reason).then(() => true).catch(() => false);
    if (!done) return notice(message, "__Couldn't timeout that member (check my role position/permissions)__");

    await recordAction(message.guild.id, 'timeout');
    await card(message, {
      title: 'Command',
      lines: [`__Timed out__ **${target.username}** __until__ <t:${Math.floor((Date.now() + ms) / 1000)}:R>`, `__Reason__ : ${reason}`],
    });
  },
};
