const { changeAccess } = require('../../utils/access/channelAccess');

module.exports = {
  name: 'lock',
  aliases: [],
  description: 'Lock a channel to prevent messages',
  usage: '[#channel]',
  category: 'Moderation Commands',
  async execute(message, args) {
    return changeAccess(message, args, 'lock');
  },
};
