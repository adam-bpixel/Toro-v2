'use strict';
const { notice, card, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { isWorkMode, setWorkMode } = require('../../models/core/workmode');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'workmode',
  aliases: [],
  description: 'Ignore everyone except the owner - on or off',
  usage: 'on|off',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const sub = (args[0] || '').toLowerCase();
    if (sub !== 'on' && sub !== 'off') {
      return usageCard(message, {
        summary: 'Ignore every message and interaction except the owner\'s',
        usage: '&workmode <on|off>',
        notes: [`__Currently__ : **${isWorkMode() ? 'on' : 'off'}**`],
      });
    }

    await setWorkMode(sub === 'on');
    return card(message, {
      title: 'Work Mode',
      lines: [
        sub === 'on'
          ? `${EMOJI.success} __Work mode enabled - the bot will ignore everyone except you__`
          : `${EMOJI.success} __Work mode disabled - the bot is back to normal__`,
      ],
    });
  },
};
