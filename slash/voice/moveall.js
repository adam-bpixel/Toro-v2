'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Move all members from one voice channel to another", [{"type":7,"name":"from","description":"From this voice channel","required":true,"channel_types":[2,13]},{"type":7,"name":"to","description":"To this voice channel","required":true,"channel_types":[2,13]}], {"native":"moveall"}],
];

module.exports = {
  name: "moveall",
  data: buildData("moveall", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
