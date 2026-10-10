'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Check premium subscription status", [], {"command":"subscription","tokens":[]}],
];

module.exports = {
  name: "subscription",
  data: buildData("subscription", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
