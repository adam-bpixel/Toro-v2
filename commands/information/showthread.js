const { card, notice } = require('../../utils/render/embeds');
const { resolveUser } = require('../../utils/access/resolve');
const { comma } = require('../../utils/format');

module.exports = {
  name: 'showthread',
  aliases: [],
  description: 'Show thread logs of a user',
  usage: '[ID|@member|username]',
  category: 'Information Commands',
  async execute(message, args) {
    const target = await resolveUser(message, args);
    const { threads } = require('./thread');
    const query = { userId: target.id, ...(message.guild ? { guildId: message.guild.id } : {}) };
    const [total, latest] = await Promise.all([
      threads().countDocuments(query),
      threads().find(query).sort({ createdAt: -1 }).limit(10).toArray(),
    ]).catch(() => [0, null]);
    if (!latest) return notice(message, '__Could not read the thread logs right now__');
    if (!total) return notice(message, `__**${target.username}** has no thread posts__`);

    const lines = latest.map((p) => {
      const text = p.content.length > 80 ? `${p.content.slice(0, 77)}...` : p.content;
      return `<t:${Math.floor(new Date(p.createdAt).getTime() / 1000)}:R> - ${text} (♡ \`${comma(p.likes)}\`)`;
    });
    await card(message, { title: `${target.username}'s Threads (${comma(total)})`, lines });
  },
};
