const { resolveUser } = require('../../utils/access/resolve');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'forceadd',
  aliases: [],
  description: 'Force add a user to a clan',
  usage: '<clanID> <ID|@member|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Force add a user to a clan',
        usage: '&forceadd <clanID> <ID|@member|username>',
        notes: ['Ignores the member limit and moves the user out of their current clan'],
      });
    }
    if (!(await clans.requireManager(message))) return;
    const { guild } = message;

    const clan = await clans.getClan(guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');
    const target = await resolveUser(message, args.slice(1), { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    if (target.bot) return notice(message, "__A bot can't be in a clan__");
    if (!(await guild.members.fetch(target.id).catch(() => null))) return notice(message, "__That user isn't in this server__");

    const problem = await clans.forceAddMember(guild, clan, target.id);
    if (problem) return notice(message, `__${problem}__`);
    return card(message, { title: 'Clan Command', lines: [`__Added__ **${target.username}** __to__ **${clan.name}**`] });
  },
};
