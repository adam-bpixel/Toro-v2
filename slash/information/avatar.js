'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "View a user's avatar", [{"type":6,"name":"user","description":"Whose avatar to view","required":false}], {"command":"avatar","tokens":[]}],
];

module.exports = {
  name: "avatar",
  data: buildData("avatar", ROWS, { dm: true }),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
