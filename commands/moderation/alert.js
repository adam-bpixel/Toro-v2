const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget } = require('../../utils/access/permissions');
const { logAlert } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');
const { EMOJI } = require('../../utils/emojis');

const COOLDOWN_MS = 300000;

module.exports = {
  name: 'alert',
  aliases: [],
  description: 'Send an alert message to a user via DM',
  usage: '<ID|@member|username> <reason>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Send an alert to a user via DM',
        usage: '&alert <ID|@member|username> <reason>',
        notes: ['Cooldown: 300 seconds'],
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      const targetCheck = checkTarget(message, member);
      if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    }

    const cd = hit(`alert:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 60000)}m__`);

    const reason = args.slice(1).join(' ');
    const alertId = await logAlert(message.guild.id, target.id, reason, message.author.id);

    await card(message, {
      title: `${EMOJI.success} Success`,
      lines: [`**${target.username}** __has been Alerted__`],
    });
    target.send(`You have been alerted in **${message.guild.name}**\nReason: ${reason}\nID: \`${alertId}\``).catch(() => {});
  },
};
