'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["", "Toggle member/role permissions in a channel", [{"type":9,"name":"target","description":"The member or role","required":true},{"type":3,"name":"permission","description":"The permission","required":true,"choices":[{"name":"send_messages","value":"send_messages"},{"name":"view_channel","value":"view_channel"},{"name":"connect","value":"connect"},{"name":"speak","value":"speak"},{"name":"attach_files","value":"attach_files"},{"name":"embed_links","value":"embed_links"},{"name":"add_reactions","value":"add_reactions"},{"name":"external_emojis","value":"external_emojis"},{"name":"manage_messages","value":"manage_messages"},{"name":"mention_everyone","value":"mention_everyone"},{"name":"stream","value":"stream"},{"name":"voice_activity","value":"voice_activity"},{"name":"create_threads","value":"create_threads"}]},{"type":3,"name":"state","description":"What to do with it","required":true,"choices":[{"name":"allow","value":"allow"},{"name":"deny","value":"deny"},{"name":"reset","value":"reset"}]}], {"native":"mperm"}],
];

module.exports = {
  name: "mperm",
  data: buildData("mperm", ROWS),
  rows: ROWS,
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
