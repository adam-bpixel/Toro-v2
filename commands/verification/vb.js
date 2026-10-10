const { grant } = require('../../models/enforcement/verification');

module.exports = {
  name: 'vb',
  aliases: [],
  description: 'Grant verification to a boy',
  usage: '<ID|@member|username>',
  category: 'Verification System',
  async execute(message, args) {
    await grant(message, args, 'boy');
  },
};
