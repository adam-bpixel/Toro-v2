'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Server full Setup + fast Setup", [], {"command":"setup","tokens":[]}],
];

module.exports = {
  name: "setup",
  data: buildData("setup", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
