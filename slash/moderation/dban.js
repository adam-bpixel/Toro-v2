'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Ban a member and send them a DM", [{"type":6,"name":"member","description":"The member to ban","required":true},{"type":3,"name":"reason","description":"Why","required":true}], {"command":"dmban","tokens":["$member","$reason"]}],
];

module.exports = {
  name: "dban",
  data: buildData("dban", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
