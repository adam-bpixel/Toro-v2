const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'poke', verb: 'poked', description: 'Poke someone' });
