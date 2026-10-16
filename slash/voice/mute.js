'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Mute a member in voice", [{"type":6,"name":"member","description":"The member","required":true},{"type":3,"name":"duration","description":"For how long, like 10m","required":false},{"type":3,"name":"reason","description":"Why","required":false}], {"command":"mute","tokens":["$member","$duration","$reason"]}],
];

module.exports = {
  name: "mute",
  data: buildData("mute", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
