'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Unban a user from the server", [{"type":6,"name":"user","description":"The user to unban","required":true},{"type":3,"name":"reason","description":"Why","required":false}], {"native":"unban"}],
];

module.exports = {
  name: "unban",
  data: buildData("unban", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
