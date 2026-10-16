'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Close ticket channels", [], {"native":"ticket-close"}],
];

module.exports = {
  name: "ticket-close",
  data: buildData("ticket-close", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
