const { card, notice, usageCard } = require('../../utils/render/embeds');
const { OWNER_EMOJI } = require('../../utils/emojis');
const { isOwner } = require('../../models/economy/premium');

module.exports = {
  name: 'leaveserver',
  aliases: ['leaveguild'],
  description: 'Make the bot leave a server',
  usage: '<server ID>',
  category: 'Owner Commands',
  async execute(message, args, client) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');
    const id = (args[0] || '').trim();
    if (!/^\d{15,25}$/.test(id)) return usageCard(message, { summary: 'Make the bot leave a server', usage: '&leaveserver <server ID>', notes: ['Use `&servers` to see the IDs'] });

    const guild = client.guilds.cache.get(id);
    if (!guild) return notice(message, "__I'm not in a server with that ID__");

    await card(message, { title: `${OWNER_EMOJI.leave} Leaving Server`, lines: [`__Leaving__ **${guild.name}** (\`${guild.id}\`)`] });
    await guild.leave();
  },
};
