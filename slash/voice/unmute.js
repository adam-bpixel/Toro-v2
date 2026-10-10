'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Unmute a member in voice", [{"type":6,"name":"member","description":"The member","required":true}], {"command":"unmute","tokens":["$member"]}],
];

module.exports = {
  name: "unmute",
  data: buildData("unmute", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
