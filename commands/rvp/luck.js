const { getBalance, addBalance } = require('../../models/economy/economy');
const { card, notice } = require('../../utils/render/embeds');
const { comma, parseAmount } = require('../../utils/format');
const { hit } = require('../../utils/runtime/cooldown');
const { EMOJI, FAIL } = require('../../utils/emojis');

const MIN_BET = 10;
const COOLDOWN_MS = 5000;

module.exports = {
  name: 'luck',
  aliases: ['gamble', 'bet'],
  description: 'Bet RVP - win x2 or lose it all',
  usage: '<amount>',
  category: 'Rvp System',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Luck',
        lines: [
          '__`&luck <amount>`__',
          '__Win : x2 your bet | Lose : lose your bet__',
          '__Supports : 100, 1k, 10m, 1b__',
          `__Cooldown : ${COOLDOWN_MS / 1000} seconds__`,
        ],
      });
    }

    const balance = await getBalance(message.author.id);
    const amount = parseAmount(args[0], balance);
    if (!amount || amount < MIN_BET) {
      return notice(message, `__At least ${MIN_BET} ${EMOJI.coin} to play, come on!__`);
    }
    if (amount > balance) {
      return notice(message, `__You don't have \`${comma(amount)}\` ${EMOJI.coin}__`);
    }

    const cd = hit(`luck:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) {
      return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);
    }

    const won = Math.random() < 0.5;
    const delta = won ? amount : -amount;
    const newBalance = await addBalance(message.author.id, delta);

    await card(message, {
      title: 'Luck',
      lines: [
        won
          ? `__You won__ \`+${comma(amount)}\` ${EMOJI.coin} ${EMOJI.success}`
          : `__You lost__ \`-${comma(amount)}\` ${EMOJI.coin} ${FAIL}`,
        `__Balance__ : \`${comma(newBalance)}\` ${EMOJI.coin}`,
      ],
    });
  },
};
