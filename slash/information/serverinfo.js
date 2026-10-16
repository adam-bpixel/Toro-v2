'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "View server information", [], {"command":"server","tokens":[]}],
];

module.exports = {
  name: "serverinfo",
  data: buildData("serverinfo", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
