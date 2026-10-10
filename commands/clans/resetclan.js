const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'resetclan',
  aliases: [],
  description: 'Reset voice hours for a specific clan',
  usage: '<clanID>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Reset the voice hours of every member of a clan',
        usage: '&resetclan <clanID>',
      });
    }
    if (!(await clans.requireManager(message))) return;

    const clan = await clans.getClan(message.guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');

    await clans.resetHours(message.guild.id, clan.clanId);
    return card(message, { title: 'Clan Command', lines: [`__Reset the voice hours of__ **${clan.name}**`] });
  },
};
