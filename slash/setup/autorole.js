'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add an autorole", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"autorole","tokens":["add","$role"]}],
  ["remove", "Remove autoroles", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"autorole","tokens":["remove","$role"]}],
  ["list", "List all autoroles", [], {"command":"autorole","tokens":["list"]}],
  ["clear", "Clear all autoroles", [], {"command":"autorole","tokens":["clear"]}],
];

module.exports = {
  name: "autorole",
  data: buildData("autorole", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
