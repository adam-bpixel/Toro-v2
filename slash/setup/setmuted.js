'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["set", "Set the muted role", [{"type":8,"name":"role","description":"The role","required":true}], {"native":"setmuted"}],
  ["show", "Show the current muted role", [], {"native":"setmuted"}],
];

module.exports = {
  name: "setmuted",
  data: buildData("setmuted", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
