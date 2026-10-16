'use strict';
const { mergeExports } = require('../../utils/runtime/mergeExports');
const autoroleSetup = require('./autoroleSetup');
const autotagSetup = require('./autotagSetup');
const levelRoles = require('./levelRoles');
const roleGroupsSetup = require('./roleGroupsSetup');
const rolesSetup = require('./rolesSetup');
const roleRequest = require('./roleRequest');

const roles = mergeExports({ autoroleSetup, autotagSetup, levelRoles, roleGroupsSetup, rolesSetup, roleRequest });

// Picked up by handlers/interactionRouter.js.
roles.routes = [
  { name: 'roles.autorole', match: roles.isAutoroleInteraction, handle: (i) => roles.handleAutoroleInteraction(i) },
  { name: 'roles.autotag', match: roles.isAutotagInteraction, handle: (i) => roles.handleAutotagInteraction(i) },
  { name: 'roles.rolesSetup', match: roles.isRolesSetupInteraction, handle: (i) => roles.handleRolesSetupInteraction(i) },
  { name: 'roles.levelRoles', match: roles.isLevelRolesInteraction, handle: (i) => roles.handleLevelRolesInteraction(i) },
  { name: 'roles.roleGroups', match: roles.isRoleGroupsInteraction, handle: (i) => roles.handleRoleGroupsInteraction(i) },
  { name: 'roles.roleRequest', match: roles.isRoleRequestInteraction, handle: (i) => roles.handleRoleRequestInteraction(i) },
];

module.exports = roles;
