'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add a jailer role", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"jailer","tokens":["add","$role"]}],
  ["remove", "Remove jailer roles", [{"type":8,"name":"role","description":"The role","required":true}], {"command":"jailer","tokens":["remove","$role"]}],
  ["list", "List all jailer roles", [], {"command":"jailer","tokens":["list"]}],
];

module.exports = {
  name: "jailer",
  data: buildData("jailer", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
