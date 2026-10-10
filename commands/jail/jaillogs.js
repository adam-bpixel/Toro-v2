const { resolveUser } = require('../../utils/access/resolve');
const { isJailer } = require('../../utils/access/permissions');
const { getGuildConfig, getJailActionLogs } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');

module.exports = {
  name: 'jaillogs',
  aliases: [],
  description: 'View jail history of a member',
  usage: '<ID|@member|username>',
  category: 'Jail System',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'View jail history of a member',
        usage: '&jaillogs <ID|@member|username>',
        notes: ['Requires jailer permission'],
      });
    }

    const config = await getGuildConfig(message.guild.id);
    if (!isJailer(message.member, config)) return notice(message, "__You don't have permission__");

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");

    const logs = await getJailActionLogs(message.guild.id, target.id, 'jail');
    if (!logs.length) {
      return card(message, { title: 'Jail Logs', lines: [`__${target.username} has no jail logs__`], ping: false });
    }

    const lines = logs.slice(0, 10).map((log, i) =>
      `**#${i + 1}** ${log.reason}\n  - By: <@${log.moderatorId}>\n  - Date: <t:${Math.floor(new Date(log.createdAt).getTime() / 1000)}:R>`,
    );
    await card(message, {
      title: `Jail Logs - ${target.username}`,
      lines: [`__Total Jails__ : \`${logs.length}\``, ...lines],
      ping: false,
    });
  },
};
