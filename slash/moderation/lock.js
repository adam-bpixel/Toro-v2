'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Lock a channel", [{"type":7,"name":"channel","description":"The channel (defaults to this one)","required":false,"channel_types":[0,5]}], {"command":"lock","tokens":["$channel"]}],
];

module.exports = {
  name: "lock",
  data: buildData("lock", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
