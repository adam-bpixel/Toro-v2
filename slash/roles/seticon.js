'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Change role icon", [{"type":8,"name":"role","description":"The role","required":true},{"type":3,"name":"emoji","description":"An emoji or image URL","required":false},{"type":11,"name":"image","description":"Or an image","required":false}], {"command":"roleicon","tokens":["$role","$emoji","$image"]}],
];

module.exports = {
  name: "seticon",
  data: buildData("seticon", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
