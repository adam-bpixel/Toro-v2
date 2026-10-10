'use strict';
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { resolveUser } = require('../../utils/access/resolve');
const { giveCardBoost } = require('../../models/economy/economy');
const { parseDuration, duration } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');

function parseMultiplier(input) {
  const match = String(input || '').trim().match(/^(\d+(?:\.\d+)?)x?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

module.exports = {
  name: 'cardgive',
  aliases: [],
  description: 'Give a member a temporary XP boost card',
  usage: '<user> <multiplier> <duration>',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    const multiplier = parseMultiplier(args[1]);
    const durationMs = parseDuration(args[2]);

    if (!target || !multiplier || !durationMs) {
      return usageCard(message, {
        summary: 'Give a member a temporary XP boost card',
        usage: '&cardgive <user> <multiplier> <duration>',
        notes: ['Multiplier examples: `2`, `2x`, `1.5`', 'Duration examples: `30m`, `1h`, `2d` - required'],
      });
    }

    const { expiresAt } = await giveCardBoost(target.id, multiplier, durationMs);
    return card(message, {
      title: `${EMOJI.card} Card Given`,
      lines: [
        `__Gave__ ${target} __a__ \`${multiplier}x\` __XP boost card__`,
        `__Expires__ : <t:${Math.floor(expiresAt.getTime() / 1000)}:R> __(${duration(durationMs)})__`,
      ],
    });
  },
};
