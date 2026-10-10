'use strict';
const { dispatch, buildData } = require('../../handlers/slashRuntime');

const ROWS = [
  ["add", "Add a ticket category", [{"type":3,"name":"name","description":"The category name (letters)","required":true,"max_length":30},{"type":3,"name":"description","description":"A short description","required":false,"max_length":90},{"type":3,"name":"emoji","description":"An emoji for it","required":false}], {"native":"ticket-category"}],
  ["remove", "Remove ticket categories", [{"type":3,"name":"name","description":"The category to remove","required":true}], {"native":"ticket-category"}],
  ["list", "List all ticket categories", [], {"native":"ticket-category"}],
];

module.exports = {
  name: "ticket-category",
  data: buildData("ticket-category", ROWS),
  async execute(interaction) {
    return dispatch(interaction, ROWS);
  },
};
