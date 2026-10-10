'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Setup staff application system", [{"type":7,"name":"channel","description":"Where to post the panel","required":false,"channel_types":[0,5]}], {"command":"sendpanel","tokens":["apply","$channel"]}],
];

module.exports = {
  name: "staffapply",
  data: buildData("staffapply", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
