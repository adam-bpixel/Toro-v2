'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add an emoji to the server", [{"type":3,"name":"name","description":"The emoji name","required":true},{"type":3,"name":"emoji","description":"An emoji or image URL","required":false},{"type":11,"name":"image","description":"Or an image","required":false}], {"command":"emoji","tokens":["add","$name","$emoji","$image"]}],
  ["list", "List all server emojis", [], {"command":"emoji","tokens":["list"]}],
];

module.exports = {
  name: "emoji",
  data: buildData("emoji", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
