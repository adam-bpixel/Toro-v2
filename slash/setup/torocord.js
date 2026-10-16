'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Setup ToroCord system channels", [], {"native":"torocord"}],
];

module.exports = {
  name: "torocord",
  data: buildData("torocord", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
