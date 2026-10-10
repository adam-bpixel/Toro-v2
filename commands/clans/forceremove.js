const { resolveUser } = require('../../utils/access/resolve');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'forceremove',
  aliases: [],
  description: 'Force remove a user from a clan',
  usage: '<ID|@member|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Force remove a user from their clan',
        usage: '&forceremove <ID|@member|username>',
        notes: ["A clan's leader can't be removed - transfer the leadership or delete the clan"],
      });
    }
    if (!(await clans.requireManager(message))) return;
    const { guild } = message;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const clan = await clans.getClanOf(guild.id, target.id);
    if (!clan) return notice(message, `__**${target.username}** isn't in a clan__`);

    const problem = await clans.removeMember(guild, clan, target.id);
    if (problem) return notice(message, `__${problem}__`);
    return card(message, { title: 'Clan Command', lines: [`__Removed__ **${target.username}** __from__ **${clan.name}**`] });
  },
};
