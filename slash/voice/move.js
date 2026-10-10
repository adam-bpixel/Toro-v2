'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Move a member to another voice channel", [{"type":6,"name":"member","description":"The member","required":true},{"type":7,"name":"channel","description":"The voice channel","required":false,"channel_types":[2,13]}], {"command":"move","tokens":["$member","$channel:id"]}],
];

module.exports = {
  name: "move",
  data: buildData("move", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
