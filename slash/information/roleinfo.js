'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "View information about a role", [{"type":8,"name":"role","description":"The role to inspect","required":true}], {"command":"roleinfo","tokens":["$role"]}],
];

module.exports = {
  name: "roleinfo",
  data: buildData("roleinfo", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
