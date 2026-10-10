const { claimDaily } = require('../../models/economy/economy');
const { card } = require('../../utils/render/embeds');
const { comma, duration } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'daily',
  aliases: ['dailyreward', 'd', 'claimdaily'],
  description: 'Claim your daily RVP reward',
  usage: '',
  category: 'Rvp System',
  async execute(message) {
    const result = await claimDaily(message.author.id);
    if (!result.ok) {
      return card(message, {
        title: 'Daily Reward',
        lines: [`__Already claimed today__`, `__Next claim in ${duration(result.remainingMs)}__`],
      });
    }
    await card(message, {
      title: 'Daily Reward',
      lines: [
        `__Claimed__ : \`+${comma(result.amount)}\` ${EMOJI.coin} ${EMOJI.success}`,
        `__Streak__ : \`${result.streak} day${result.streak === 1 ? '' : 's'}\``,
        `__Balance__ : \`${comma(result.balance)}\` ${EMOJI.coin}`,
      ],
    });
  },
};
