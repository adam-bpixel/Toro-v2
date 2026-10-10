const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'feed', verb: 'fed', description: 'Feed someone' });
