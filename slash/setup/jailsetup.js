'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["set", "Set the jail role", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"jailsetup","tokens":["$role"]}],
  ["show", "Show current jail role", [], {"command":"jailsetup","tokens":["show"]}],
];

module.exports = {
  name: "jailsetup",
  data: buildData("jailsetup", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
