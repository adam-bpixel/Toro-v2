const { getUser, dailyXpOf, MAX_DAILY_XP } = require('../../models/economy/economy');
const { card } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');

module.exports = {
  name: 'mymaxdaily',
  aliases: [],
  description: 'Check today\'s XP cap progress',
  usage: '',
  category: 'Rvp System',
  async execute(message) {
    const user = await getUser(message.author.id);
    const current = dailyXpOf(user);
    const percent = ((current / MAX_DAILY_XP) * 100).toFixed(1);
    await card(message, {
      title: 'Max Daily XP',
      lines: [
        `__Max Daily XP :__ \`${comma(MAX_DAILY_XP)}\``,
        `__Current Daily XP :__ \`${comma(current)}\` (${percent}%)`,
        `__Remaining :__ \`${comma(Math.max(0, MAX_DAILY_XP - current))}\``,
      ],
    });
  },
};
