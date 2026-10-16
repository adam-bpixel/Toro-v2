'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Show verification system configuration", [], {"native":"verification-show"}],
];

module.exports = {
  name: "verification-show",
  data: buildData("verification-show", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
