const { resolveUser } = require('../../utils/access/resolve');
const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const COOLDOWN_MS = 10000;

module.exports = {
  name: 'removecoleader',
  aliases: [],
  description: 'Remove a co-leader from your clan',
  usage: '<@user|userID|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Clan Command',
        lines: [
          '__Remove a co-leader from your clan__',
          '__Usage: `&removecoleader <@user|userID|username>`__',
          '__Cooldown 10 seconds__',
        ],
      });
    }
    const clan = await clans.requireClanRank(message, { leaderOnly: true });
    if (!clan) return;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");

    const cooldownKey = `coleader:${message.guild.id}:${message.author.id}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;
    const problem = await clans.demoteCoLeader(message.guild, clan, target.id);
    if (problem) return notice(message, `__${problem}__`);
    clans.startCooldown(cooldownKey);

    return card(message, {
      title: 'Clan Command',
      lines: [`__Removed__ **${target.username}** __as a co-leader of__ **${clan.name}**`],
    });
  },
};
