const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'tickle', verb: 'tickled', description: 'Tickle someone' });
