'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Timeout a member", [{"type":6,"name":"member","description":"The member to timeout","required":true},{"type":3,"name":"duration","description":"For how long, like 10m, 2h or 1d","required":true},{"type":3,"name":"reason","description":"Why","required":true}], {"native":"timeout"}],
];

module.exports = {
  name: "timeout",
  data: buildData("timeout", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
