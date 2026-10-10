'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "View user rank card", [], {"command":"rank","tokens":[]}],
];

module.exports = {
  name: "rank",
  data: buildData("rank", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
