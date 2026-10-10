const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'pat', verb: 'patted', description: 'Pat someone' });
