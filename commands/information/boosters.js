const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'boosters',
  aliases: [],
  description: 'Show members who boosted the server',
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    if (!message.guild) return notice(message, '__This command only works inside a server__');
    await message.guild.members.fetch().catch(() => {});
    const boosters = message.guild.members.cache
      .filter((m) => m.premiumSince)
      .sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp);

    if (!boosters.size) {
      return card(message, { title: 'Notice', lines: ['__No boosters found in this server__'] });
    }

    const lines = boosters.map((m) => `${m} - __boosting since__ <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`);
    await card(message, { title: `Boosters (${boosters.size})`, lines: lines.slice(0, 20) });
  },
};
