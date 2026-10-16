'use strict';
const { mergeExports } = require('../../utils/runtime/mergeExports');
const ticketSetup = require('./ticketSetup');
const ticketUI = require('./ticketUI');
const ticketActions = require('./ticketActions');

const tickets = mergeExports({ ticketSetup, ticketUI, ticketActions });

// Picked up by handlers/interactionRouter.js.
tickets.routes = [
  { name: 'tickets.setupButton', match: (i) => i.isButton() && i.customId === tickets.SETUP_BUTTON_ID, handle: (i) => tickets.openTicketConfigPanel(i) },
  { name: 'tickets.setupModal', match: (i) => i.isModalSubmit() && i.customId === tickets.SETUP_MODAL_ID, handle: (i) => tickets.handleTicketSetupModalSubmit(i) },
  {
    name: 'tickets',
    match: (i) => (i.isButton() || i.isStringSelectMenu()) && (i.customId.startsWith('ticket_') || i.customId === 'close_ticket'),
    handle: (i) => tickets.handleTicketInteraction(i),
  },
];

module.exports = tickets;
