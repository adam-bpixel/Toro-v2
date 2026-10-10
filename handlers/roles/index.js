'use strict';
const autoroleSetup = require('./autoroleSetup');
const autotagSetup = require('./autotagSetup');
const levelRoles = require('./levelRoles');
const roleGroupsSetup = require('./roleGroupsSetup');
const rolesSetup = require('./rolesSetup');
const roleRequest = require('./roleRequest');

module.exports = {
  ...autoroleSetup,
  ...autotagSetup,
  ...levelRoles,
  ...roleGroupsSetup,
  ...rolesSetup,
  ...roleRequest,
};
