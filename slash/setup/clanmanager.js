'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add a clan manager role", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"clanmanager","tokens":["add","$role"]}],
  ["remove", "Remove clan manager roles", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"clanmanager","tokens":["remove","$role"]}],
  ["list", "List all clan manager roles", [], {"command":"clanmanager","tokens":["list"]}],
];

module.exports = {
  name: "clanmanager",
  data: buildData("clanmanager", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
