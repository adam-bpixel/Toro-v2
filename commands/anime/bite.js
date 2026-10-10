const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'bite', verb: 'bitten', description: 'Bite someone' });
