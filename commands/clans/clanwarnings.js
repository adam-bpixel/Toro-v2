const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');
const { getGuildConfig } = require('../../models/core/moderation');

module.exports = {
  name: 'clanwarnings',
  aliases: [],
  description: 'View clan warnings',
  usage: '[clanID]',
  category: 'Clans Commands',
  async execute(message, args) {
    const { guild } = message;
    const own = await clans.getClanOf(guild.id, message.author.id);
    const isManager = clans.canManageClans(message.member, await getGuildConfig(guild.id));
    const isLeadership = own && clans.rankOf(own, message.author.id) !== 'member';
    if (!isManager && !isLeadership) return notice(message, "__You don't have permission__");

    let clan = own;
    if (args.length) {
      clan = await clans.getClan(guild.id, clans.parseClanId(args[0]));
      if (!clan) return notice(message, '__Invalid clan ID__');
      if (!isManager && clan.clanId !== own.clanId) return notice(message, '__You can only see the warnings of your own clan__');
    } else if (!clan) {
      return usageCard(message, { summary: 'View the warnings of a clan', usage: '&clanwarnings <clanID>', notes: ['Find the ID with `&clans`'] });
    }

    return card(message, {
      title: 'Clan Warnings',
      lines: [`__Clan__ : **${clan.name}**`, `__ID__ : \`${clan.clanId}\``, `__Warnings__ : ${clan.warnings || 0}`],
    });
  },
};
