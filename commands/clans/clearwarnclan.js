const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'clearwarnclan',
  aliases: [],
  description: 'Clear the warnings of a clan',
  usage: '<clanID>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, { title: 'Clear Clan Warnings', lines: ['__`&clearwarnclan <clanID>`__'] });
    }
    if (!(await clans.requireManager(message))) return;

    const clan = await clans.getClan(message.guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');

    const cleared = await clans.clearWarnings(message.guild, clan);
    return card(message, {
      title: 'Clear Clan Warnings',
      lines: [`__Cleared__ ${cleared} __warning${cleared === 1 ? '' : 's'} from__ **${clan.name}**`],
    });
  },
};
