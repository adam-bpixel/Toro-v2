const { changeAccess } = require('../../utils/access/channelAccess');

module.exports = {
  name: 'unhide',
  aliases: [],
  description: 'Show a hidden channel to @everyone again',
  usage: '[#channel]',
  category: 'Moderation Commands',
  async execute(message, args) {
    return changeAccess(message, args, 'unhide');
  },
};
