'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Delete multiple messages from a channel", [{"type":4,"name":"amount","description":"How many messages (1-100)","required":true,"min_value":1,"max_value":100}], {"command":"clear","tokens":["$amount"]}],
];

module.exports = {
  name: "clear",
  data: buildData("clear", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
