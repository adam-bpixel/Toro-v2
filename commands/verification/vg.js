const { grant } = require('../../models/enforcement/verification');

module.exports = {
  name: 'vg',
  aliases: [],
  description: 'Grant verification to a girl',
  usage: '<ID|@member|username>',
  category: 'Verification System',
  async execute(message, args) {
    await grant(message, args, 'girl');
  },
};
