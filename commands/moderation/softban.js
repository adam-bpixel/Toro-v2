const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { limitReached, recordAction } = require('../../models/enforcement/modTools');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');

const COOLDOWN_MS = 30000;

module.exports = {
  name: 'softban',
  aliases: ['kicknuke'],
  description: 'Softban a member ban and unban to delete messages',
  usage: '<ID|@member|username> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Softban a member (ban and unban to delete their messages)',
        usage: '&softban <ID|@member|username> <reason>',
        notes: ['The reason is required for this action', 'Deletes the last 7 days of their messages', 'Cooldown: 30 seconds'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      const targetCheck = checkTarget(message, member);
      if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    } else if (target.id === message.author.id || target.id === message.client.user.id) {
      return notice(message, "__You can't target that user__");
    }

    const limit = await limitReached(message.guild.id, 'ban');
    if (limit) return notice(message, limit);
    const cd = hit(`softban:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const reason = args.slice(1).join(' ');
    await target.send(`You have been softbanned from **${message.guild.name}** (your messages were deleted, you may rejoin)\nReason: ${reason}`).catch(() => {});
    const banned = await message.guild.members.ban(target.id, { reason: `Softban: ${reason}`, deleteMessageSeconds: 7 * 86400 }).catch(() => null);
    if (!banned) return notice(message, "__Couldn't softban that user (check my role position/permissions)__");
    const unbanned = await message.guild.members.unban(target.id, 'Softban').then(() => true).catch(() => false);
    await recordAction(message.guild.id, 'ban');

    await card(message, {
      title: 'Command',
      lines: [
        `__Softbanned__ **${target.username}**`,
        `__Reason__ : ${reason}`,
        ...(unbanned ? [] : ["__I couldn't unban them - use `&unban` to let them back__"]),
      ],
    });
  },
};
