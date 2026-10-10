'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Transfer RVP to another user", [{"type":6,"name":"member","description":"Who gets it","required":true},{"type":4,"name":"amount","description":"How much RVP","required":true,"min_value":1}], {"native":"transfer"}],
];

module.exports = {
  name: "transfer",
  data: buildData("transfer", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
