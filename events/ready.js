'use strict';
const figlet = require('figlet');
const gradient = require('gradient-string');
const { Events } = require('discord.js');
const { defaultPrefix } = require('../utils/defaultPrefix');
const db = require('../models/core/db');
const clans = require('../models/economy/clans');
const { registerAzkar } = require('../handlers/setup/azkar');
const { syncEmojis, syncBotAvatarLogo } = require('../services/emojiSync');
const { syncWebhookBranding } = require('../services/webhookBranding');

const pinkGradient = gradient(['#ff9fd6', '#ff4fa3', '#ff1493']);
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(ready, client) {
    console.log(pinkGradient.multiline(figlet.textSync('TORO', { font: 'ANSI Shadow' })));
    const mongoUp = await db.isConnected();
    const registered = await ready.application.commands.fetch().catch((error) => {
      console.error('Could not fetch slash commands for help mentions:', error);
      return null;
    });
    const slashCount = registered ? registered.size : client.slashCommands.size;
    const rows = [
      ['Logged in as', ready.user.tag],
      ['MongoDB', mongoUp ? 'connected' : 'not connected', mongoUp ? null : RED],
      ['Commands', client.commands.size],
      ['Slash commands', slashCount],
      ['Default prefix', defaultPrefix()],
    ];
    const width = Math.max(...rows.map(([label]) => label.length));
    for (const [label, value, color] of rows) {
      const shown = color ? `${color}${value}${RESET}` : pinkGradient(String(value));
      console.log(`${pinkGradient(`${label.padEnd(width)} : `)}${shown}`);
    }
    clans.rehydrateVoiceSessions(ready).catch((error) => console.error('Could not restore the clan voice sessions:', error.message));
    registerAzkar(client).catch((error) => console.error('Could not start the Azkar schedules:', error.message));
    syncWebhookBranding(client).catch((error) => console.error('Webhook branding sync failed:', error.message));
    setTimeout(() => {
      syncEmojis(client).catch((error) => console.error('Emoji sync failed:', error.message));
      syncBotAvatarLogo(client).catch((error) => console.error('Bot avatar logo sync failed:', error.message));
    }, 10000);
  },
};
