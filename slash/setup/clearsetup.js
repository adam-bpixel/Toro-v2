'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add skip channel or category", [{"type":7,"name":"channel","description":"A channel or category","required":true}], {"command":"clearsetup","tokens":["add","$channel"]}],
  ["remove", "Remove skip channel or category", [{"type":7,"name":"channel","description":"A channel or category","required":true}], {"command":"clearsetup","tokens":["remove","$channel"]}],
  ["list", "List skip channels", [], {"command":"clearsetup","tokens":["list"]}],
];

module.exports = {
  name: "clearsetup",
  data: buildData("clearsetup", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
