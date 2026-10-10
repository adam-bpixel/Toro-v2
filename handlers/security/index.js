'use strict';
const logs = require('./logs');
const logsSetup = require('./logsSetup');
const globalLogs = require('./globalLogs');
const inviteTracker = require('./inviteTracker');
const protection = require('./protection');

module.exports = {
  ...logs,
  ...logsSetup,
  ...globalLogs,
  ...inviteTracker,
  ...protection,
};
