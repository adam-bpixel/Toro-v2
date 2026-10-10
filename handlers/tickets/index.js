'use strict';
const ticketSetup = require('./ticketSetup');
const ticketUI = require('./ticketUI');
const ticketActions = require('./ticketActions');

module.exports = {
  ...ticketSetup,
  ...ticketUI,
  ...ticketActions,
};
