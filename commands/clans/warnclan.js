const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'warnclan',
  aliases: [],
  description: 'Warn a clan',
  usage: '<clanID>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Warn a clan',
        usage: '&warnclan <clanID>',
        notes: ['See them with `&clanwarnings`, clear them with `&clearwarnclan`'],
      });
    }
    if (!(await clans.requireManager(message))) return;

    const clan = await clans.getClan(message.guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');

    const total = await clans.warnClan(message.guild, clan);
    const notified = await clans.notifyLeadersOfWarning(message.guild, clan, total);
    return card(message, {
      title: 'Warn Clan',
      lines: [`__Warned__ **${clan.name}**`, `__Warnings__ : ${total}`, `__Leaders notified__ : ${notified.sent}/${notified.total}`],
    });
  },
};
