'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "View a user's banner", [{"type":6,"name":"user","description":"Whose banner to view","required":false}], {"command":"banner","tokens":[]}],
];

module.exports = {
  name: "banner",
  data: buildData("banner", ROWS, { dm: true }),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
