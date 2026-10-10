const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { limitReached, recordAction } = require('../../models/enforcement/modTools');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');

const COOLDOWN_MS = 10000;

module.exports = {
  name: 'kick',
  aliases: [],
  description: 'Kick a member from the server',
  usage: '<ID|@member|username> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Kick a member from the server',
        usage: '&kick <ID|@member|username> <reason>',
        notes: ['The reason is required for this action', 'Cooldown: 10 seconds'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");
    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);

    const limit = await limitReached(message.guild.id, 'kick');
    if (limit) return notice(message, limit);
    const cd = hit(`kick:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const reason = args.slice(1).join(' ');
    const kicked = await member.kick(reason).then(() => true).catch(() => false);
    if (!kicked) return notice(message, "__Couldn't kick that user (check my role position/permissions)__");

    await recordAction(message.guild.id, 'kick');
    await card(message, { title: 'Command', lines: [`__Kicked__ **${target.username}**`, `__Reason__ : ${reason}`] });
  },
};
