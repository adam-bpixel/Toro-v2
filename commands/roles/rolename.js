const { resolveManagedRole } = require('../../utils/access/roleTarget');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'rolename',
  aliases: [],
  description: 'Rename a role',
  usage: '<@role|roleID|rolename> <newname>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return card(message, {
        title: 'Rolename Command',
        lines: ['__`&rolename <@role|roleID|rolename> <newname>`__'],
      });
    }

    const result = resolveManagedRole(message, args[0]);
    if (result.error) return notice(message, `__${result.error}__`);
    const { role } = result;
    const newName = args.slice(1).join(' ').slice(0, 100);
    const oldName = role.name;

    await role.setName(newName).catch(() => null);

    await card(message, {
      title: 'Rolename Command',
      lines: [`__Renamed__ **${oldName}** __to__ **${newName}**`],
    });
  },
};
