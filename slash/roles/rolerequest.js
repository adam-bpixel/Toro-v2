'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["setup", "Setup role request channels", [{"type":7,"name":"channel","description":"Where to post the panel","required":false,"channel_types":[0,5]}], {"command":"sendpanel","tokens":["rrequest","$channel"]}],
  ["roles", "Add roles to category", [], {"command":"setup","tokens":[]}],
  ["custom", "Create custom category", [], {"command":"setup","tokens":[]}],
  ["editcategory", "Edit a custom category", [], {"command":"setup","tokens":[]}],
  ["removecategory", "Remove a custom category", [], {"command":"setup","tokens":[]}],
  ["show", "Show all role request configurations", [], {"command":"setup","tokens":[]}],
];

module.exports = {
  name: "rolerequest",
  data: buildData("rolerequest", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
