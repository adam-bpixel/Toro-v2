const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'lick', verb: 'licked', description: 'Lick someone' });
