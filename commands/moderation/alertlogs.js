const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { getAlertLogs } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');

module.exports = {
  name: 'alertlogs',
  aliases: [],
  description: 'View alert logs for a user',
  usage: '<ID|@member|username>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'View alert logs for a user',
        usage: '&alertlogs <ID|@member|username>',
      });
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");

    const logs = await getAlertLogs(message.guild.id, target.id);
    if (!logs.length) {
      return card(message, { title: `Alert Logs - ${target.username}`, lines: ['__No alerts on record__'], ping: false });
    }

    const lines = logs.slice(0, 10).map((log, i) =>
      `**#${i + 1}** ${log.reason}\n  - ID: \`${log.alertId}\`\n  - By: <@${log.moderatorId}>\n  - Date: <t:${Math.floor(new Date(log.createdAt).getTime() / 1000)}:R>`,
    );
    await card(message, {
      title: `Alert Logs - ${target.username}`,
      lines: [`__Total Alerts__ : \`${logs.length}\``, ...lines],
      ping: false,
    });
  },
};
