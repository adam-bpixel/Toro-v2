const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'edit-chatclan',
  aliases: [],
  description: 'Set a custom chat channel for a clan',
  usage: '<clanID> <#channel|channelID>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Set a custom chat channel for a clan',
        usage: '&edit-chatclan <clanID> <#channel|channelID>',
        notes: ['The chat channel the bot made for that clan (if any) is deleted'],
      });
    }
    if (!(await clans.requireManager(message))) return;
    const { guild } = message;

    const clan = await clans.getClan(guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');
    const channel = clans.resolveChannel(message, args[1], clans.CHANNEL_KINDS.chat.types);
    if (!channel) return notice(message, "__Couldn't find that text channel__");

    const problem = await clans.setClanChannel(guild, clan, 'chat', channel);
    if (problem) return notice(message, `__${problem}__`);
    return card(message, { title: 'Clan Command', lines: [`__Chat channel of__ **${clan.name}** __is now__ ${channel}`] });
  },
};
