'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Shows server statistics", [], {"command":"stats","tokens":[]}],
];

module.exports = {
  name: "stats",
  data: buildData("stats", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
