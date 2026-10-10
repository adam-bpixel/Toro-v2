'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Unlock a channel", [{"type":7,"name":"channel","description":"The channel (defaults to this one)","required":false,"channel_types":[0,5]}], {"command":"unlock","tokens":["$channel"]}],
];

module.exports = {
  name: "unlock",
  data: buildData("unlock", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
