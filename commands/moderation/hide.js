const { changeAccess } = require('../../utils/access/channelAccess');

module.exports = {
  name: 'hide',
  aliases: [],
  description: 'Hide a channel from @everyone',
  usage: '[#channel]',
  category: 'Moderation Commands',
  async execute(message, args) {
    return changeAccess(message, args, 'hide');
  },
};
