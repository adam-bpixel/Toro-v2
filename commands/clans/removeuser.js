const { resolveUser } = require('../../utils/access/resolve');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const COOLDOWN_MS = 10000;

module.exports = {
  name: 'removeuser',
  aliases: ['remove'],
  description: 'Remove a user from your clan',
  usage: '<ID|@member|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Remove a user from your clan',
        usage: '&removeuser <ID|@member|username>',
        notes: ['Cooldown: 10 seconds'],
      });
    }
    const clan = await clans.requireClanRank(message);
    if (!clan) return;
    const { guild } = message;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");

    const isLeader = clan.leaderId === message.author.id;
    if (!isLeader && clan.coleaderIds.includes(target.id)) {
      return notice(message, '__Co-leaders can only remove regular members__');
    }

    const cooldownKey = `removeuser:${guild.id}:${message.author.id}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;
    const problem = await clans.removeMember(guild, clan, target.id);
    if (problem) return notice(message, `__${problem}__`);
    clans.startCooldown(cooldownKey);

    return card(message, {
      title: 'Clan Command',
      lines: [`__Removed__ **${target.username}** __from__ **${clan.name}**`],
    });
  },
};
