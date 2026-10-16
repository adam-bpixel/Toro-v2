'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add a muter role", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"muter","tokens":["add","$role"]}],
  ["remove", "Remove a muter role", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"muter","tokens":["remove","$role"]}],
  ["list", "List all muter roles", [], {"command":"muter","tokens":["list"]}],
];

module.exports = {
  name: "muter",
  data: buildData("muter", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
