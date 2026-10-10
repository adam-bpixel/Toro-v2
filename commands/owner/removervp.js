'use strict';
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { resolveUser } = require('../../utils/access/resolve');
const { getBalance, addBalance } = require('../../models/economy/economy');
const { parseAmount, comma } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'removervp',
  aliases: [],
  description: "Remove RVP coins from a member's balance",
  usage: '<user> <amount|all>',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const usage = () => usageCard(message, { summary: "Remove RVP coins from a member's balance", usage: '&removervp <user> <amount|all>' });
    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return usage();

    const balance = await getBalance(target.id);
    const amount = parseAmount(args[1], balance);
    if (amount === null) return usage();
    if (amount <= 0) return notice(message, `__${target} has nothing to remove__`);

    const newBalance = await addBalance(target.id, -amount);
    return card(message, {
      title: `${EMOJI.coin} RVP Removed`,
      lines: [`__Took__ \`${comma(amount)}\` ${EMOJI.coin} __from__ ${target}`, `__New Balance__ : \`${comma(newBalance)}\` ${EMOJI.coin}`],
    });
  },
};
