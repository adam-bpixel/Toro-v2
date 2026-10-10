const { showCategories, showPanel, showRoles, notSetUp } = require('../../handlers/claimroles');

const handlers = {
  panel: showPanel,
  categories: showCategories,
  roles: showRoles,
};

module.exports = {
  name: 'claimroles',
  data: {
    name: 'claimroles',
    description: 'Manage claim roles',
    options: [
      { type: 1, name: 'panel', description: 'Manage the claim roles panel', options: [] },
      { type: 1, name: 'categories', description: 'Manage claim roles categories', options: [] },
      { type: 1, name: 'roles', description: 'Manage the claimable roles', options: [] },
    ],
  },
  async execute(interaction) {
    const handler = handlers[interaction.options.getSubcommand()] || notSetUp;
    await handler(interaction);
  },
};
