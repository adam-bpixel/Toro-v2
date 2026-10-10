const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'deleteclan',
  aliases: [],
  description: 'Delete a clan',
  usage: '<clanID>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Delete Clan Command',
        lines: [
          '__`&deleteclan <clanID>`__',
          '__Delete a clan and remove its roles__',
          '__Requires Administrator or Clan Manager role__',
        ],
      });
    }
    if (!(await clans.requireManager(message))) return;

    const clan = await clans.getClan(message.guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');

    await clans.deleteClan(message.guild, clan);
    return card(message, {
      title: 'Delete Clan Command',
      lines: [`__Deleted clan__ **${clan.name}**`, `__ID__ : \`${clan.clanId}\``],
    });
  },
};
