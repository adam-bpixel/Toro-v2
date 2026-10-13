'use strict';
const afk = require('./activity/afk');
const aliases = require('./settings/aliases');
const autoreply = require('./settings/autoreply');
const blacklist = require('./core/blacklist');
const clans = require('./economy/clans');
const db = require('./core/db');
const economy = require('./economy/economy');
const giveaway = require('./economy/giveaway');
const guildStats = require('./activity/guildStats');
const modTools = require('./enforcement/modTools');
const moderation = require('./core/moderation');
const noprefix = require('./enforcement/noprefix');
const prefix = require('./settings/prefix');
const premium = require('./economy/premium');
const profiles = require('./economy/profiles');
const theme = require('./settings/theme');
const verification = require('./enforcement/verification');
const workmode = require('./core/workmode');

module.exports = {
  afk,
  aliases,
  autoreply,
  blacklist,
  clans,
  db,
  economy,
  giveaway,
  guildStats,
  modTools,
  moderation,
  noprefix,
  prefix,
  premium,
  profiles,
  theme,
  verification,
  workmode,
};
