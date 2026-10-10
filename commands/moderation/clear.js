const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../models/core/moderation');
const { payloadOf, notice, usageCard } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'clear',
  aliases: ['purge', 'ms7', 'clean'],
  description: 'Clear messages from a channel',
  usage: '<amount>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return notice(message, "__You don't have permission__");
    }

    const config = await getGuildConfig(message.guild.id);
    if ((config.clearSkipChannelIds || []).includes(message.channel.id)) {
      return notice(message, '__Clear is disabled in this channel__');
    }

    if (!args[0]) {
      return usageCard(message, {
        summary: 'Delete multiple messages from a channel',
        usage: '&clear <amount>',
        notes: ['__Amount must be between 1 and 100__'],
      });
    }

    const amount = Number(args[0]);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return notice(message, '__Give an amount between 1 and 100__');
    }

    const deleted = await message.channel.bulkDelete(amount + 1, true).catch(() => null);
    if (!deleted) return notice(message, "__Couldn't delete those messages (too old, or missing permission)__");

    const sent = await message.channel.send(payloadOf({
      title: `${EMOJI.success} Success`,
      lines: [`__Cleared ${Math.max(0, deleted.size - 1)} messages__`],
    }));
    setTimeout(() => sent.delete().catch(() => {}), 4000);
  },
};
