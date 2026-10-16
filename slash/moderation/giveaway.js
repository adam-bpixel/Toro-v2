'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["create", "Create a new giveaway", [{"type":3,"name":"prize","description":"What is given away","required":true,"max_length":200},{"type":3,"name":"duration","description":"How long, like 30m, 1h or 1d","required":true},{"type":4,"name":"winners","description":"How many winners","required":false,"min_value":1,"max_value":20},{"type":7,"name":"channel","description":"Where to post it (defaults to this one)","required":false,"channel_types":[0,5]},{"type":6,"name":"host","description":"The host (defaults to you)","required":false}], {"native":"giveaway"}],
  ["end", "Force end a giveaway", [{"type":3,"name":"message_id","description":"The giveaway message ID","required":true}], {"native":"giveaway"}],
  ["reroll", "Reroll giveaway winners", [{"type":3,"name":"message_id","description":"The giveaway message ID","required":true}], {"native":"giveaway"}],
  ["delete", "Delete a giveaway", [{"type":3,"name":"message_id","description":"The giveaway message ID","required":true}], {"native":"giveaway"}],
  ["edit", "Edit a giveaway", [{"type":3,"name":"message_id","description":"The giveaway message ID","required":true},{"type":3,"name":"prize","description":"The new prize","required":false,"max_length":200},{"type":4,"name":"winners","description":"The new number of winners","required":false,"min_value":1,"max_value":20},{"type":3,"name":"duration","description":"A new time left, like 1h","required":false}], {"native":"giveaway"}],
  ["list", "List all active giveaways", [], {"native":"giveaway"}],
];

module.exports = {
  name: "giveaway",
  data: buildData("giveaway", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
