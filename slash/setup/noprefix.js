'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["self add", "Run one of your commands without a prefix (5 at most)", [{"type":3,"name":"command","description":"The command name","required":true}], {"command":"noprefix","tokens":["self","add","$command"]}],
  ["self remove", "Make one of your commands need the prefix again", [{"type":3,"name":"command","description":"The command name","required":true}], {"command":"noprefix","tokens":["self","remove","$command"]}],
  ["self list", "List your no-prefix commands", [], {"command":"noprefix","tokens":["self","list"]}],
  ["server add", "Let everyone run a command without a prefix (30 at most)", [{"type":3,"name":"command","description":"The command name","required":true}], {"command":"noprefix","tokens":["server","add","$command"]}],
  ["server remove", "Make a server command need the prefix again", [{"type":3,"name":"command","description":"The command name","required":true}], {"command":"noprefix","tokens":["server","remove","$command"]}],
  ["server list", "List the server no-prefix commands", [], {"command":"noprefix","tokens":["server","list"]}],
];

module.exports = {
  name: "noprefix",
  data: buildData("noprefix", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
