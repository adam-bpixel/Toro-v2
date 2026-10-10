const { resolveUser } = require('../../utils/access/resolve');
const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const COOLDOWN_MS = 30 * 60 * 1000;

module.exports = {
  name: 'switchleader',
  aliases: ['transferleader'],
  description: 'Transfer clan leadership to another member',
  usage: '<@user|userID|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Clan Command',
        lines: [
          '__Transfer leadership to another member__',
          '__Usage: `&switchleader <@user|userID|username>`__',
          '__Leader only__',
          '__Cooldown 30 minutes per clan__',
        ],
      });
    }
    const clan = await clans.requireClanRank(message, { leaderOnly: true });
    if (!clan) return;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    if (target.id === clan.leaderId) return notice(message, '__You are already the leader__');
    if (!clan.memberIds.includes(target.id)) return notice(message, "__That user isn't in your clan__");

    const cooldownKey = `switchleader:${message.guild.id}:${clan.clanId}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;
    const problem = await clans.transferLeader(message.guild, clan, target.id);
    if (problem) return notice(message, `__${problem}__`);
    clans.startCooldown(cooldownKey);

    return card(message, {
      title: 'Clan Command',
      lines: [`__Leadership of__ **${clan.name}** __passed to__ **${target.username}**`],
    });
  },
};
