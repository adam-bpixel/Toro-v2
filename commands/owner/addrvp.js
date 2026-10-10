'use strict';
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { resolveUser } = require('../../utils/access/resolve');
const { addBalance } = require('../../models/economy/economy');
const { parseAmount, comma } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'addrvp',
  aliases: [],
  description: "Add RVP coins to a member's balance",
  usage: '<user> <amount>',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    const amount = parseAmount(args[1]);
    if (!target || amount === null) {
      return usageCard(message, { summary: "Add RVP coins to a member's balance", usage: '&addrvp <user> <amount>' });
    }

    const balance = await addBalance(target.id, amount);
    return card(message, {
      title: `${EMOJI.coin} RVP Added`,
      lines: [`__Gave__ \`${comma(amount)}\` ${EMOJI.coin} __to__ ${target}`, `__New Balance__ : \`${comma(balance)}\` ${EMOJI.coin}`],
    });
  },
};
