const { PermissionFlagsBits } = require('discord.js');
const { getMaxWarn, setMaxWarn, MAXWARN_ACTIONS } = require('../../models/enforcement/modTools');
const { parseDuration } = require('../../utils/format');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

const describe = (m) => `\`${m.count}\` warnings → \`${m.action}\`${m.action === 'timeout' ? ` for \`${m.durationLabel || '1d'}\`` : ''}`;

module.exports = {
  name: 'maxwarn',
  aliases: [],
  description: 'Configure max warnings system',
  usage: '<number|off> [timeout|kick|ban] [duration]',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      const current = await getMaxWarn(message.guild.id);
      return usageCard(message, {
        summary: 'Configure max warnings system',
        usage: '&maxwarn <number|off> [timeout|kick|ban] [duration]',
        notes: [current ? `Current: ${describe(current)}` : 'Current: off', 'Default action: timeout for 1d', 'Requires Manage Server permission'],
      });
    }

    if (args[0].toLowerCase() === 'off') {
      await setMaxWarn(message.guild.id, null);
      return card(message, { title: `${EMOJI.success} Max Warn`, lines: ['__Max warnings turned off__'] });
    }

    const count = Number(args[0]);
    if (!Number.isInteger(count) || count < 1 || count > 50) return notice(message, '__Give a number between 1 and 50, or `off`__');
    const action = (args[1] || 'timeout').toLowerCase();
    if (!MAXWARN_ACTIONS.includes(action)) return notice(message, `__Action must be one of: ${MAXWARN_ACTIONS.join(', ')}__`);

    const value = { count, action };
    if (action === 'timeout') {
      const label = args[2] || '1d';
      const ms = parseDuration(label);
      if (!ms || ms > 28 * 86400000) return notice(message, '__Give a duration like `10m`, `2h` or `1d` (28 days at most)__');
      value.durationMs = ms;
      value.durationLabel = label;
    }
    await setMaxWarn(message.guild.id, value);
    await card(message, { title: `${EMOJI.success} Max Warn`, lines: [`__Members reaching__ ${describe(value)}`] });
  },
};
