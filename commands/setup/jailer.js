const { PermissionFlagsBits } = require('discord.js');
const { resolveRole } = require('../../utils/access/resolve');
const { getGuildConfig, addJailerRole, removeJailerRole } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'jailer',
  aliases: [],
  description: 'Manage roles that can use jail commands',
  usage: 'add <@role|roleID|rolename>',
  category: 'Setup Commands',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(sub)) {
      return card(message, {
        title: 'Jailer Roles',
        lines: [
          '__Manage roles that can use jail commands__',
          '__`&jailer add <@role|roleID|rolename>`__',
          '__`&jailer remove <@role|roleID|rolename>`__',
          '__`&jailer list`__',
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    const config = await getGuildConfig(message.guild.id);

    if (sub === 'list') {
      const roles = (config.jailerRoleIds || []).map((id) => message.guild.roles.cache.get(id)).filter(Boolean);
      return card(message, {
        title: 'Jailer Roles',
        lines: roles.length ? roles.map((r) => `${r}`) : ['__No jailer roles configured__'],
      });
    }

    const role = resolveRole(message, args.slice(1).join(' '));
    if (!role) return notice(message, "__Couldn't find that role__");

    if (sub === 'add') {
      await addJailerRole(message.guild.id, role.id);
      return card(message, { title: 'Jailer Roles', lines: [`__Added__ ${role} __as a jailer role__`] });
    }

    await removeJailerRole(message.guild.id, role.id);
    return card(message, { title: 'Jailer Roles', lines: [`__Removed__ ${role} __as a jailer role__`] });
  },
};
