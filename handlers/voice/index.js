'use strict';
const { mergeExports } = require('../../utils/runtime/mergeExports');
const voicemaster = require('./voicemaster');
const tempvoice = require('./tempvoice');
const tempvoiceSetup = require('./tempvoiceSetup');
const voiceControls = require('./voiceControls');
const voiceActions = require('./voiceActions');

const voice = mergeExports({ voicemaster, tempvoice, tempvoiceSetup, voiceControls, voiceActions });

// Picked up by handlers/interactionRouter.js.
voice.routes = [
  { name: 'voice.tempVoiceSetup', match: voice.isTempVoiceSetupInteraction, handle: (i) => voice.handleTempVoiceSetupInteraction(i) },
  { name: 'voice.voiceMaster', match: voice.isVoiceMasterInteraction, handle: (i) => voice.handleVoiceMasterInteraction(i) },
];

module.exports = voice;
