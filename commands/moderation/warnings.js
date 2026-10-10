const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { getWarnings } = require('../../models/enforcement/modTools');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'warnings',
  aliases: [],
  description: 'View user warnings',
  usage: '[ID|@member|username]',
  category: 'Moderation Commands',
  async execute(message, args) {
    const target = await resolveUser(message, args, { fallbackToAuthor: !args.length });
    if (!target) return notice(message, "__Couldn't find that user__");
    if (target.id !== message.author.id && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return notice(message, "__You don't have permission__");
    }

    const logs = await getWarnings(message.guild.id, target.id);
    if (!logs.length) return card(message, { title: `Warnings - ${target.username}`, lines: ['__No warnings on record__'], ping: false });

    const lines = logs.slice(0, 10).map((log, i) =>
      `**#${i + 1}** ${log.reason}\n  - ID: \`${log.warnId}\`\n  - By: <@${log.moderatorId}>\n  - Date: <t:${Math.floor(new Date(log.createdAt).getTime() / 1000)}:R>`,
    );
    await card(message, {
      title: `Warnings - ${target.username}`,
      lines: [`__Total Warnings__ : \`${logs.length}\``, ...lines, ...(logs.length > 10 ? ['__Showing the latest 10__'] : [])],
      ping: false,
    });
  },
};
