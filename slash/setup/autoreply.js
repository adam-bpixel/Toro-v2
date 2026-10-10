'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Manage auto reply system", [], {"command":"autoreply","tokens":[]}],
];

module.exports = {
  name: "autoreply",
  data: buildData("autoreply", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
