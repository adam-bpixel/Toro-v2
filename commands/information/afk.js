const { setAfk } = require('../../models/activity/afk');
const { card } = require('../../utils/render/embeds');

module.exports = {
  name: 'afk',
  aliases: [],
  description: 'Set your AFK status with an optional message',
  usage: '[reason]',
  category: 'Information Commands',
  async execute(message, args) {
    const reason = args.join(' ') || 'AFK';
    setAfk(message.author.id, reason);
    await card(message, { title: 'AFK Status Set', lines: [`You are now AFK : **${reason}**`] });
  },
};
