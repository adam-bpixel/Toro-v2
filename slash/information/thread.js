'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Create a simulated thread post", [{"type":3,"name":"text","description":"The post text","required":true}], {"command":"thread","tokens":["$text"]}],
];

module.exports = {
  name: "thread",
  data: buildData("thread", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
