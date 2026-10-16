'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Leave voice channel", [], {"native":"leave"}],
];

module.exports = {
  name: "leave",
  data: buildData("leave", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
