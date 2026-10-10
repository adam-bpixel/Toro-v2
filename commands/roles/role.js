const { resolveMemberAndRole } = require('../../utils/access/roleTarget');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'role',
  aliases: ['togglerole', 'padd'],
  description: 'Assign or remove a role from a user',
  usage: '<ID|@member|username> <@role|roleID|rolename>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return card(message, {
        title: 'Role Command',
        lines: ['__`&role <ID|@member|username> <@role|roleID|rolename>`__'],
      });
    }

    const result = await resolveMemberAndRole(message, args);
    if (result.error) return notice(message, `__${result.error}__`);
    const { member, role } = result;

    const has = member.roles.cache.has(role.id);
    await (has ? member.roles.remove(role) : member.roles.add(role));

    await card(message, {
      title: 'Role Command',
      lines: [`__${has ? 'Removed' : 'Added'}__ ${role} __${has ? 'from' : 'to'}__ **${member.user.username}**`],
    });
  },
};
