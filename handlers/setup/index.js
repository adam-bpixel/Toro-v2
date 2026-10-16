'use strict';
const { mergeExports } = require('../../utils/runtime/mergeExports');
const prefixSetup = require('./prefixSetup');
const noprefixSetup = require('./noprefixSetup');
const aliasesSetup = require('./aliasesSetup');
const commandManageSetup = require('./commandManageSetup');
const counterSetup = require('./counterSetup');
const counters = require('./counters');
const themeSetup = require('./themeSetup');
const azkarSetup = require('./azkarSetup');
const azkar = require('./azkar');
const welcomerSetup = require('./welcomerSetup');
const boostSetup = require('./boostSetup');
const honeypotSetup = require('./honeypotSetup');
const autoreplySetup = require('./autoreplySetup');
const clanManagerSetup = require('./clanManagerSetup');
const subscriptionSetup = require('./subscriptionSetup');
const clearSetupPanel = require('./clearSetupPanel');
const supportReport = require('./supportReport');
const suggestReport = require('./suggestReport');

const setup = mergeExports({
  prefixSetup,
  noprefixSetup,
  aliasesSetup,
  commandManageSetup,
  counterSetup,
  counters,
  themeSetup,
  azkarSetup,
  azkar,
  welcomerSetup,
  boostSetup,
  honeypotSetup,
  autoreplySetup,
  clanManagerSetup,
  subscriptionSetup,
  clearSetupPanel,
  supportReport,
  suggestReport,
});

// Picked up by handlers/interactionRouter.js.
setup.routes = [
  { name: 'setup.clanManager', match: setup.isClanManagerSetupInteraction, handle: (i) => setup.handleClanManagerSetupInteraction(i) },
  { name: 'setup.noPrefix', match: setup.isNoPrefixSetupInteraction, handle: (i) => setup.handleNoPrefixSetupInteraction(i) },
  { name: 'setup.autoreply', match: setup.isAutoreplyInteraction, handle: (i) => setup.handleAutoreplyInteraction(i) },
  { name: 'setup.aliases', match: setup.isAliasesSetupInteraction, handle: (i) => setup.handleAliasesSetupInteraction(i) },
  { name: 'setup.clear', match: setup.isClearSetupInteraction, handle: (i) => setup.handleClearSetupInteraction(i) },
  { name: 'setup.counter', match: setup.isCounterSetupInteraction, handle: (i) => setup.handleCounterSetupInteraction(i) },
  { name: 'setup.prefix', match: setup.isPrefixSetupInteraction, handle: (i) => setup.handlePrefixSetupInteraction(i) },
  { name: 'setup.commandManage', match: setup.isCommandManageInteraction, handle: (i) => setup.handleCommandManageInteraction(i) },
  { name: 'setup.subscription', match: setup.isSubscriptionSetupInteraction, handle: (i) => setup.handleSubscriptionSetupInteraction(i) },
  { name: 'setup.theme', match: setup.isThemeSetupInteraction, handle: (i) => setup.handleThemeSetupInteraction(i) },
  { name: 'setup.azkar', match: setup.isAzkarSetupInteraction, handle: (i) => setup.handleAzkarSetupInteraction(i) },
  { name: 'setup.welcomer', match: setup.isWelcomerSetupInteraction, handle: (i) => setup.handleWelcomerSetupInteraction(i) },
  { name: 'setup.boost', match: setup.isBoostSetupInteraction, handle: (i) => setup.handleBoostSetupInteraction(i) },
  { name: 'setup.honeypot', match: setup.isHoneypotSetupInteraction, handle: (i) => setup.handleHoneypotSetupInteraction(i) },
  { name: 'setup.support', match: setup.isSupportInteraction, handle: (i) => setup.handleSupportInteraction(i) },
  { name: 'setup.suggest', match: setup.isSuggestInteraction, handle: (i) => setup.handleSuggestInteraction(i) },
];

module.exports = setup;
