const { resolveMemberAndRole } = require('../../utils/access/roleTarget');
const { card, notice } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'roleadd',
  aliases: ['radd'],
  description: 'Add a role to a user',
  usage: '<ID|@member|username> <@role|roleID|rolename>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return card(message, {
        title: 'Role Add',
        lines: ['__`&roleadd <ID|@member|username> <@role|roleID|rolename>`__'],
      });
    }

    const result = await resolveMemberAndRole(message, args);
    if (result.error) return notice(message, `__${result.error}__`);
    const { member, role } = result;

    if (member.roles.cache.has(role.id)) {
      return notice(message, `__**${member.user.username}** already has__ ${role}`);
    }
    await member.roles.add(role);

    await card(message, {
      title: `${EMOJI.success} Role Add`,
      lines: [`__Added__ ${role} __to__ **${member.user.username}**`],
    });
  },
};
