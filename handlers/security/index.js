'use strict';
const { mergeExports } = require('../../utils/runtime/mergeExports');
const logs = require('./logs');
const logsSetup = require('./logsSetup');
const globalLogs = require('./globalLogs');
const inviteTracker = require('./inviteTracker');
const protection = require('./protection');

const security = mergeExports({ logs, logsSetup, globalLogs, inviteTracker, protection });

// Picked up by handlers/interactionRouter.js.
security.routes = [
  { name: 'security.logsSetup', match: security.isLogsSetupInteraction, handle: (i) => security.handleLogsSetupInteraction(i) },
];

module.exports = security;
