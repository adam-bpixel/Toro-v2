'use strict';
const prefixSetup = require('./prefixSetup');
const noprefixSetup = require('./noprefixSetup');
const aliasesSetup = require('./aliasesSetup');
const commandManageSetup = require('./commandManageSetup');
const counterSetup = require('./counterSetup');
const counters = require('./counters');
const themeSetup = require('./themeSetup');
const azkarSetup = require('./azkarSetup');
const azkar = require('./azkar');
const autoreplySetup = require('./autoreplySetup');
const clanManagerSetup = require('./clanManagerSetup');
const subscriptionSetup = require('./subscriptionSetup');
const clearSetupPanel = require('./clearSetupPanel');
const supportReport = require('./supportReport');
const suggestReport = require('./suggestReport');

module.exports = {
  ...prefixSetup,
  ...noprefixSetup,
  ...aliasesSetup,
  ...commandManageSetup,
  ...counterSetup,
  ...counters,
  ...themeSetup,
  ...azkarSetup,
  ...azkar,
  ...autoreplySetup,
  ...clanManagerSetup,
  ...subscriptionSetup,
  ...clearSetupPanel,
  ...supportReport,
  ...suggestReport,
};
