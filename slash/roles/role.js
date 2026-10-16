'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Assign or remove a role from a user", [{"type":6,"name":"member","description":"The member","required":true},{"type":8,"name":"role","description":"The role","required":true}], {"command":"role","tokens":["$member","$role"]}],
];

module.exports = {
  name: "role",
  data: buildData("role", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
