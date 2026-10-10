const { makeReactionCommand } = require('../../services/animeReactions');

module.exports = makeReactionCommand({ name: 'hug', verb: 'hugged', description: 'Hug someone' });
