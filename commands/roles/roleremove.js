const { resolveMemberAndRole } = require('../../utils/access/roleTarget');
const { card, notice } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'roleremove',
  aliases: ['rremove'],
  description: 'Remove a role from a user',
  usage: '<ID|@member|username> <@role|roleID|rolename>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return card(message, {
        title: 'Role Remove',
        lines: ['__`&roleremove <ID|@member|username> <@role|roleID|rolename>`__'],
      });
    }

    const result = await resolveMemberAndRole(message, args);
    if (result.error) return notice(message, `__${result.error}__`);
    const { member, role } = result;

    if (!member.roles.cache.has(role.id)) {
      return notice(message, `__**${member.user.username}** doesn't have__ ${role}`);
    }
    await member.roles.remove(role);

    await card(message, {
      title: `${EMOJI.success} Role Remove`,
      lines: [`__Removed__ ${role} __from__ **${member.user.username}**`],
    });
  },
};
