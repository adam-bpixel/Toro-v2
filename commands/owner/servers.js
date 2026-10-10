const { card, notice } = require('../../utils/render/embeds');
const { OWNER_EMOJI } = require('../../utils/emojis');
const { isOwner } = require('../../models/economy/premium');
const { comma } = require('../../utils/format');

const SHOWN = 20;

module.exports = {
  name: 'servers',
  aliases: [],
  description: 'List the servers the bot is in',
  usage: '',
  category: 'Owner Commands',
  async execute(message, args, client) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
    const members = guilds.reduce((sum, g) => sum + g.memberCount, 0);
    const lines = guilds.slice(0, SHOWN).map((g, i) => `\`${i + 1}\` **${g.name}** (\`${g.id}\`) - \`${comma(g.memberCount)}\` members`);
    if (guilds.length > SHOWN) lines.push(`__...and ${guilds.length - SHOWN} more__`);
    await card(message, {
      title: `${OWNER_EMOJI.servers} Servers (${comma(guilds.length)})`,
      lines: [`__Total members__ : \`${comma(members)}\``, ...lines],
    });
  },
};
