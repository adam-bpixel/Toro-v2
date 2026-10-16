'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Server activity statistics - joins, leaves, messages", [], {"command":"stats","tokens":[]}],
];

module.exports = {
  name: "statistic",
  data: buildData("statistic", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
