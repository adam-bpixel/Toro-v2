const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'cuddle', verb: 'cuddled', description: 'Cuddle someone' });
