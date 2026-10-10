'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add a verificator role", [{"type":8,"name":"role","description":"The role","required":true}], {"native":"verificator"}],
  ["remove", "Remove a verificator role", [{"type":8,"name":"role","description":"The role","required":true}], {"native":"verificator"}],
  ["list", "List all verificator roles", [], {"native":"verificator"}],
];

module.exports = {
  name: "verificator",
  data: buildData("verificator", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
