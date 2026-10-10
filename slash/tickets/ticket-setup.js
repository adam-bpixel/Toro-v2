'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Setup the ticket system", [], {"command":"setup","tokens":[]}],
];

module.exports = {
  name: "ticket-setup",
  data: buildData("ticket-setup", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
