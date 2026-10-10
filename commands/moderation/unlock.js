const { changeAccess } = require('../../utils/access/channelAccess');

module.exports = {
  name: 'unlock',
  aliases: [],
  description: 'Let @everyone send messages in a locked channel again',
  usage: '[#channel]',
  category: 'Moderation Commands',
  async execute(message, args) {
    return changeAccess(message, args, 'unlock');
  },
};
