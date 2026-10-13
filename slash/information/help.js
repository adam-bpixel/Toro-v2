'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Show all available commands", [], {"command":"help","tokens":[]}],
];

module.exports = {
  name: "help",
  data: buildData("help", ROWS, { dm: true }),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
