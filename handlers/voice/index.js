'use strict';
const voicemaster = require('./voicemaster');
const tempvoice = require('./tempvoice');
const tempvoiceSetup = require('./tempvoiceSetup');
const voiceControls = require('./voiceControls');
const voiceActions = require('./voiceActions');

module.exports = {
  ...voicemaster,
  ...tempvoice,
  ...tempvoiceSetup,
  ...voiceControls,
  ...voiceActions,
};
