const { getBalance, addBalance } = require('../../models/economy/economy');
const { card, notice, payloadOf } = require('../../utils/render/embeds');
const { comma, parseAmount } = require('../../utils/format');
const { hit } = require('../../utils/runtime/cooldown');
const activeComponents = require('../../utils/runtime/activeComponents');
const { EMOJI, FAIL } = require('../../utils/emojis');

const MIN_BET = 10;
const MAX_BET = 500000;
const COOLDOWN_MS = 5000;
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

const draw = () => ({ rank: RANKS[Math.floor(Math.random() * RANKS.length)], suit: SUITS[Math.floor(Math.random() * SUITS.length)] });
const rankValue = (rank) => (rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank));
const formatHand = (hand) => hand.map((c) => `\`${c.rank}${c.suit}\``).join(' ');

function handValue(hand) {
  let total = hand.reduce((sum, c) => sum + rankValue(c.rank), 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

const buttonsRow = () => ({
  type: 1,
  components: [
    { type: 2, style: 3, custom_id: 'bj_hit', label: 'Hit' },
    { type: 2, style: 2, custom_id: 'bj_stand', label: 'Stand' },
  ],
});

module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  description: 'Play Blackjack against the dealer',
  usage: '<amount>',
  category: 'Rvp System',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Blackjack',
        lines: [
          '__`&blackjack <amount>`__',
          '__Beat the dealer without going over 21__',
          '__Blackjack pays 2.5x__',
          '__Win pays 2x | Tie returns bet__',
          `__Min : \`${comma(MIN_BET)}\` | Max : \`${comma(MAX_BET)}\`__`,
          `__Cooldown : ${COOLDOWN_MS / 1000} seconds__`,
        ],
      });
    }

    const balance = await getBalance(message.author.id);
    const amount = parseAmount(args[0], balance);
    if (!amount || amount < MIN_BET) return notice(message, `__Minimum bet is ${comma(MIN_BET)}__`);
    if (amount > MAX_BET) return notice(message, `__Maximum bet is ${comma(MAX_BET)}__`);
    if (amount > balance) return notice(message, `__You don't have \`${comma(amount)}\` ${EMOJI.coin}__`);

    const cd = hit(`blackjack:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const player = [draw(), draw()];
    const dealer = [draw(), draw()];

    const settle = async (outcome) => {
      let delta = 0;
      let resultLine;
      if (outcome === 'blackjack') {
        delta = Math.floor(amount * 1.5);
        resultLine = `__Blackjack! You win__ \`+${comma(delta)}\` ${EMOJI.coin} ${EMOJI.success}`;
      } else if (outcome === 'bust') {
        delta = -amount;
        resultLine = `__Bust! You lose__ \`-${comma(amount)}\` ${EMOJI.coin} ${FAIL}`;
      } else if (outcome === 'dealer_bust' || outcome === 'win') {
        delta = amount;
        resultLine = `__You win__ \`+${comma(amount)}\` ${EMOJI.coin} ${EMOJI.success}`;
      } else if (outcome === 'push') {
        delta = 0;
        resultLine = "__Push, it's a tie__ — bet returned";
      } else {
        delta = -amount;
        resultLine = `__Dealer wins__ \`-${comma(amount)}\` ${EMOJI.coin} ${FAIL}`;
      }
      const newBalance = delta === 0 ? balance : await addBalance(message.author.id, delta);
      return {
        title: 'Blackjack',
        lines: [
          `__You__ : ${formatHand(player)} (\`${handValue(player)}\`)`,
          `__Dealer__ : ${formatHand(dealer)} (\`${handValue(dealer)}\`)`,
          resultLine,
          `__Balance__ : \`${comma(newBalance)}\` ${EMOJI.coin}`,
        ],
      };
    };

    if (handValue(player) === 21) {
      const outcome = handValue(dealer) === 21 ? 'push' : 'blackjack';
      return card(message, await settle(outcome));
    }

    const inProgress = (hidden = true) => ({
      title: 'Blackjack',
      lines: [
        `__You__ : ${formatHand(player)} (\`${handValue(player)}\`)`,
        `__Dealer__ : ${formatHand(hidden ? [dealer[0]] : dealer)}${hidden ? ' \`??\`' : ` (\`${handValue(dealer)}\`)`}`,
        `__Bet__ : \`${comma(amount)}\` ${EMOJI.coin}`,
      ],
      extraRows: [buttonsRow()],
    });

    const sent = await card(message, inProgress());
    activeComponents.claim(sent.id);

    const collector = sent.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 30000,
    });

    collector.on('collect', async (interaction) => {
      try {
        if (interaction.customId === 'bj_hit') {
          player.push(draw());
          if (handValue(player) > 21) {
            collector.stop('resolved');
            return await interaction.update(payloadOf(await settle('bust')));
          }
          return await interaction.update(payloadOf(inProgress()));
        }
        if (interaction.customId === 'bj_stand') {
          collector.stop('resolved');
          while (handValue(dealer) < 17) dealer.push(draw());
          const pv = handValue(player);
          const dv = handValue(dealer);
          const outcome = dv > 21 ? 'dealer_bust' : dv === pv ? 'push' : dv > pv ? 'lose' : 'win';
          return await interaction.update(payloadOf(await settle(outcome)));
        }
      } catch (error) {
        console.error('Blackjack interaction failed:', error);
      }
    });

    collector.on('end', async (_collected, reason) => {
      activeComponents.release(sent.id);
      if (reason !== 'resolved') {
        while (handValue(dealer) < 17) dealer.push(draw());
        const pv = handValue(player);
        const dv = handValue(dealer);
        const outcome = dv > 21 ? 'dealer_bust' : dv === pv ? 'push' : dv > pv ? 'lose' : 'win';
        await sent.edit(payloadOf(await settle(outcome))).catch(() => {});
      }
    });
  },
};
