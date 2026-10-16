'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["view", "View family information", [], {"command":"myclan","tokens":[]}],
  ["leave", "Leave your current family", [], {"command":"leave","tokens":[]}],
];

module.exports = {
  name: "family",
  data: buildData("family", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
