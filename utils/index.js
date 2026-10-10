'use strict';
const embeds = require('./render/embeds');
const emojis = require('./emojis');
const emojiSync = require('../services/emojiSync');
const customButton = require('./runtime/customButton');
const activeComponents = require('./runtime/activeComponents');
const channelAccess = require('./access/channelAccess');
const panels = require('./runtime/panels');
const gate = require('./access/gate');
const localize = require('./localize');
const permissions = require('./access/permissions');
const resolve = require('./access/resolve');
const roleTarget = require('./access/roleTarget');
const subscriptionCard = require('./render/subscriptionCard');
const supportServer = require('./supportServer');
const replay = require('./runtime/replay');
const cards = require('./render/cards');
const nameStyles = require('./render/nameStyles');
const nameStyleImages = require('./render/nameStyleImages');
const rankBadges = require('./render/rankBadges');
const assetHost = require('../services/assetHost');
const imageHost = require('../services/imageHost');
const animeReactions = require('../services/animeReactions');
const clanBoard = require('./render/clanBoard');
const cooldown = require('./runtime/cooldown');
const defaultPrefix = require('./defaultPrefix');
const format = require('./format');

module.exports = {
  ...embeds,
  ...emojis,
  ...emojiSync,
  customButton,
  activeComponents,
  ...channelAccess,
  ...panels,
  ...gate,
  ...localize,
  ...permissions,
  ...resolve,
  ...roleTarget,
  ...subscriptionCard,
  ...supportServer,
  ...replay,
  ...cards,
  ...nameStyles,
  ...nameStyleImages,
  ...rankBadges,
  ...assetHost,
  ...imageHost,
  ...animeReactions,
  ...clanBoard,
  cooldown,
  ...defaultPrefix,
  ...format,
};
