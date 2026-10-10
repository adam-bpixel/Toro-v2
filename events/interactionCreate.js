'use strict';
const { Events } = require('discord.js');
const { handleInteraction } = require('../handlers/interactionRouter');
const globalLogs = require('../handlers/security/globalLogs');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    try {
      await handleInteraction(interaction, client);
    } finally {
      globalLogs.logInteraction(interaction);
    }
  },
};
