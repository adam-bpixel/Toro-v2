'use strict';
const { mergeExports } = require('../../utils/runtime/mergeExports');
const applySetup = require('./applySetup');
const applyUI = require('./applyUI');

const apply = mergeExports({ applySetup, applyUI });

// Picked up by handlers/interactionRouter.js.
apply.routes = [
  { name: 'apply.setupButton', match: (i) => i.isButton() && i.customId === apply.APPLY_BUTTON_ID, handle: (i) => apply.openApplyConfigPanel(i) },
  { name: 'apply.setupModal', match: (i) => i.isModalSubmit() && i.customId === apply.APPLY_MODAL_ID, handle: (i) => apply.handleApplySetupModalSubmit(i) },
  { name: 'apply.form', match: (i) => i.isModalSubmit() && i.customId.startsWith(apply.APPLY_FORM_PREFIX), handle: (i) => apply.handleApplicationSubmit(i) },
  { name: 'apply.decision', match: (i) => i.isButton() && apply.isApplyDecision(i.customId), handle: (i) => apply.handleApplyDecision(i) },
  {
    name: 'apply.component',
    match: (i) => (i.isButton() || i.isStringSelectMenu()) && apply.isApplyComponent(i.customId),
    handle: (i) => apply.handleApplyInteraction(i),
  },
];

module.exports = apply;
