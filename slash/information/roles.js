'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Display all server roles", [], {"command":"roles","tokens":[]}],
];

module.exports = {
  name: "roles",
  data: buildData("roles", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
