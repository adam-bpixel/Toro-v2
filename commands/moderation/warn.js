const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { addWarning, getMaxWarn, limitReached, recordAction } = require('../../models/enforcement/modTools');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');
const { EMOJI } = require('../../utils/emojis');

const COOLDOWN_MS = 5000;

async function punish(member, maxWarn, total) {
  const reason = `Reached ${maxWarn.count} warnings`;
  let done = false;
  if (maxWarn.action === 'ban') done = await member.ban({ reason }).then(() => true).catch(() => false);
  else if (maxWarn.action === 'kick') done = await member.kick(reason).then(() => true).catch(() => false);
  else done = await member.timeout(maxWarn.durationMs || 86400000, reason).then(() => true).catch(() => false);
  const past = { ban: 'Banned', kick: 'Kicked', timeout: 'Timed out' }[maxWarn.action];
  return done
    ? `__${past}__ for reaching \`${total}/${maxWarn.count}\` warnings`
    : `__Reached \`${total}/${maxWarn.count}\` warnings but I couldn't ${maxWarn.action} them (check my role position/permissions)__`;
}

module.exports = {
  name: 'warn',
  aliases: [],
  description: 'Warn a user',
  usage: '<ID|@member|username> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Warn a user',
        usage: '&warn <ID|@member|username> <reason>',
        notes: ['Cooldown: 5 seconds'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");
    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);

    const limit = await limitReached(message.guild.id, 'warn');
    if (limit) return notice(message, limit);
    const cd = hit(`warn:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const reason = args.slice(1).join(' ');
    const { warnId, total } = await addWarning(message.guild.id, target.id, reason, message.author.id);
    await recordAction(message.guild.id, 'warn');
    await target.send(`You have been warned in **${message.guild.name}**\nReason: ${reason}\nID: \`${warnId}\``).catch(() => {});

    const lines = [`__Warned__ **${target.username}**`, `__Reason__ : ${reason}`, `__Total warnings__ : \`${total}\``];
    const maxWarn = await getMaxWarn(message.guild.id);
    if (maxWarn && total >= maxWarn.count) lines.push(await punish(member, maxWarn, total));
    await card(message, { title: `${EMOJI.success} Success`, lines });
  },
};
