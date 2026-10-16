'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Ban a member from the server", [{"type":6,"name":"member","description":"The member to ban","required":true},{"type":3,"name":"reason","description":"Why","required":true},{"type":4,"name":"delete_days","description":"Days of their messages to delete (0-7)","required":false,"min_value":0,"max_value":7}], {"native":"ban"}],
];

module.exports = {
  name: "ban",
  data: buildData("ban", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
