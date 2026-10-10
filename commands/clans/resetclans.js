const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'resetclans',
  aliases: [],
  description: 'Reset voice hours for all clans',
  usage: '',
  category: 'Clans Commands',
  async execute(message) {
    if (!(await clans.requireManager(message))) return;

    const count = await clans.resetHours(message.guild.id);
    if (!count) return notice(message, '__There are no clans in this server yet__');
    return card(message, {
      title: 'Clan Command',
      lines: [`__Reset the voice hours of__ ${count} __clan${count === 1 ? '' : 's'}__`],
    });
  },
};
