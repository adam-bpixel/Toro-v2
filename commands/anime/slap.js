const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'slap', verb: 'slapped', description: 'Slap someone' });
