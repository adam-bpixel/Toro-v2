'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "View information about a channel", [{"type":7,"name":"channel","description":"The channel to inspect (defaults to this channel)","required":false}], {"command":"channelinfo","tokens":["$channel"]}],
];

module.exports = {
  name: "channelinfo",
  data: buildData("channelinfo", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
