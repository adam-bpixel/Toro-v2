const noprefix = require('../../models/enforcement/noprefix');

module.exports = {
  name: 'noprefix',
  aliases: ['nopre', 'np'],
  description: 'Run commands without typing the prefix',
  usage: '<self|server> <add|remove|list> [command]',
  category: 'Setup Commands',
  async execute(message, args) {
    await noprefix.execute(message, args);
  },
};
