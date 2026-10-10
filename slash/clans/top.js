'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Show top leaderboards", [], {"command":"top","tokens":[]}],
];

module.exports = {
  name: "top",
  data: buildData("top", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
