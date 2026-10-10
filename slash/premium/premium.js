'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Enable Server Premium", [], {"command":"premium","tokens":[]}],
];

module.exports = {
  name: "premium",
  data: buildData("premium", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
