'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Check RVP balance", [], {"command":"balance","tokens":[]}],
];

module.exports = {
  name: "balance",
  data: buildData("balance", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
