const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { limitReached, recordAction } = require('../../models/enforcement/modTools');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');

const COOLDOWN_MS = 30000;

module.exports = {
  name: 'dmban',
  aliases: ['dban'],
  description: 'Ban a member and send them a DM',
  usage: '<ID|@member|username> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Ban a member and send them a DM',
        usage: '&dmban <ID|@member|username> <reason>',
        notes: ['The reason is required for this action', 'Cooldown: 30 seconds'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      const targetCheck = checkTarget(message, member);
      if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    }

    const limit = await limitReached(message.guild.id, 'ban');
    if (limit) return notice(message, limit);
    const cd = hit(`dmban:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const reason = args.slice(1).join(' ');
    await target.send(`You have been banned from **${message.guild.name}**\nReason: ${reason}`).catch(() => {});
    const banned = await message.guild.members.ban(target.id, { reason }).catch(() => null);
    if (!banned) return notice(message, "__Couldn't ban that user (check my role position/permissions)__");

    await recordAction(message.guild.id, 'ban');
    await card(message, { title: 'Command', lines: [`__Banned__ **${target.username}**`, `__Reason__ : ${reason}`] });
  },
};
