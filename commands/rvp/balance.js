const { getUser } = require('../../models/economy/economy');
const { card } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'balance',
  aliases: ['bal', 'rvp', 'c', 'credit'],
  description: 'Check your RVP balance',
  usage: '',
  category: 'Rvp System',
  async execute(message) {
    const user = await getUser(message.author.id);
    await card(message, {
      title: 'RVP Balance',
      lines: [
        `__Balance__ : \`${comma(user.balance)}\` ${EMOJI.coin}`,
        `__Streak__ : \`${user.dailyStreak} day${user.dailyStreak === 1 ? '' : 's'}\``,
      ],
    });
  },
};
