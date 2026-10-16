'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Claim your daily RVP reward", [], {"command":"daily","tokens":[]}],
];

module.exports = {
  name: "daily",
  data: buildData("daily", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
