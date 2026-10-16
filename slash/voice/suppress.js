'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Suppress or mute a member in voice", [{"type":6,"name":"member","description":"The member","required":true}], {"native":"suppress"}],
];

module.exports = {
  name: "suppress",
  data: buildData("suppress", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
