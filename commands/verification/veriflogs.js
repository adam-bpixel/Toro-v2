const { showLogs } = require('../../models/enforcement/verification');

module.exports = {
  name: 'veriflogs',
  aliases: [],
  description: 'View verification logs',
  usage: '<ID|@member|username> [page]',
  category: 'Verification System',
  async execute(message, args) {
    await showLogs(message, args);
  },
};
