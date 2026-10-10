const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'leave',
  aliases: [],
  description: 'Leave your current clan',
  usage: '',
  category: 'Clans Commands',
  async execute(message) {
    const { guild } = message;
    const clan = await clans.getClanOf(guild.id, message.author.id);
    if (!clan) return notice(message, '__You are not in a clan__');

    const problem = await clans.leaveClan(guild, clan, message.author.id);
    if (problem) return notice(message, `__${problem}__`);
    return card(message, { title: 'Clan Command', lines: [`__You left__ **${clan.name}**`] });
  },
};
