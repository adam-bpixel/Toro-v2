'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Change a member's nickname", [{"type":6,"name":"member","description":"The member","required":true},{"type":3,"name":"nickname","description":"The new nickname (empty to reset)","required":false,"max_length":32}], {"native":"nickname"}],
];

module.exports = {
  name: "nickname",
  data: buildData("nickname", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
