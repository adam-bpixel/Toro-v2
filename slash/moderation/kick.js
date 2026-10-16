'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Kick a member from the server", [{"type":6,"name":"member","description":"The member to kick","required":true},{"type":3,"name":"reason","description":"Why","required":true}], {"native":"kick"}],
];

module.exports = {
  name: "kick",
  data: buildData("kick", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
