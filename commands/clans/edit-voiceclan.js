const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'edit-voiceclan',
  aliases: [],
  description: 'Set a custom voice channel for a clan',
  usage: '<clanID> <#channel|channelID>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return usageCard(message, {
        summary: 'Set a custom voice channel for a clan',
        usage: '&edit-voiceclan <clanID> <#channel|channelID>',
        notes: ['The voice channel the bot made for that clan (if any) is deleted'],
      });
    }
    if (!(await clans.requireManager(message))) return;
    const { guild } = message;

    const clan = await clans.getClan(guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');
    const channel = clans.resolveChannel(message, args[1], clans.CHANNEL_KINDS.voice.types);
    if (!channel) return notice(message, "__Couldn't find that voice channel__");

    const problem = await clans.setClanChannel(guild, clan, 'voice', channel);
    if (problem) return notice(message, `__${problem}__`);
    return card(message, { title: 'Clan Command', lines: [`__Voice channel of__ **${clan.name}** __is now__ ${channel}`] });
  },
};
