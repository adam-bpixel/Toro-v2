'use strict';
const claimroles = require('./claimroles');
const tickets = require('./tickets');
const voice = require('./voice');
const apply = require('./apply');
const roles = require('./roles');
const security = require('./security');
const setup = require('./setup');
const interactionRouter = require('./interactionRouter');

module.exports = {
  claimroles,
  tickets,
  voice,
  apply,
  roles,
  security,
  setup,
  ...interactionRouter,
};
