'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Configure verification system", [{"type":8,"name":"boy_role","description":"The role given by &vb","required":true},{"type":8,"name":"girl_role","description":"The role given by &vg","required":true},{"type":8,"name":"unverified_role","description":"Removed from a member once verified","required":false}], {"native":"setup-verification"}],
];

module.exports = {
  name: "setup-verification",
  data: buildData("setup-verification", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
