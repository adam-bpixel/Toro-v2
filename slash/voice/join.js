'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Join a voice channel", [{"type":7,"name":"channel","description":"The voice channel (defaults to yours)","required":false,"channel_types":[2,13]}], {"native":"join"}],
];

module.exports = {
  name: "join",
  data: buildData("join", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
