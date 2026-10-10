'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Remove timeout from a member", [{"type":6,"name":"member","description":"The member","required":true}], {"native":"untimeout"}],
];

module.exports = {
  name: "untimeout",
  data: buildData("untimeout", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
