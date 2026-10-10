const { PermissionFlagsBits } = require('discord.js');
const { getLimits, setLimit, LIMIT_ACTIONS } = require('../../models/enforcement/modTools');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'setlimit',
  aliases: [],
  description: 'Set daily server-wide limits for moderation actions',
  usage: '<ban|kick|warn|timeout> <number|off>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      const limits = await getLimits(message.guild.id);
      const current = LIMIT_ACTIONS.map((a) => `\`${a}\`: ${limits[a] ? `\`${limits[a]}\`/day` : 'no limit'}`).join(' , ');
      return usageCard(message, {
        summary: 'Set daily server-wide limits for moderation actions',
        usage: '&setlimit <ban|kick|warn|timeout> <number|off>',
        notes: [`Current: ${current}`, 'Counted per day (UTC) across all moderators', 'Requires Administrator permission'],
      });
    }

    const action = args[0].toLowerCase();
    if (!LIMIT_ACTIONS.includes(action)) return notice(message, `__Action must be one of: ${LIMIT_ACTIONS.join(', ')}__`);
    const value = (args[1] || '').toLowerCase();
    if (value === 'off') {
      await setLimit(message.guild.id, action, null);
      return card(message, { title: `${EMOJI.success} Limit`, lines: [`__Removed the daily limit for__ \`${action}\``] });
    }
    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) return notice(message, '__Give a number between 1 and 1000, or `off`__');
    await setLimit(message.guild.id, action, limit);
    await card(message, { title: `${EMOJI.success} Limit`, lines: [`__Moderators can now do__ \`${limit}\` \`${action}\` __per day in total__`] });
  },
};
