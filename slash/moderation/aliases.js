'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["list", "List server aliases", [], {"command":"aliases","tokens":["list"]}],
  ["add", "Add a server alias", [{"type":3,"name":"alias","description":"The alias to create","required":true},{"type":3,"name":"command","description":"The command it should run","required":true}], {"command":"aliases","tokens":["add","$alias","$command"]}],
  ["remove", "Remove a server alias", [{"type":3,"name":"alias","description":"The alias to remove","required":true}], {"command":"aliases","tokens":["remove","$alias"]}],
];

module.exports = {
  name: "aliases",
  data: buildData("aliases", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
