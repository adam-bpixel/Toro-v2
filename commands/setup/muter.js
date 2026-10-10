const { PermissionFlagsBits } = require('discord.js');
const { resolveRole } = require('../../utils/access/resolve');
const { getGuildConfig, addMuterRole, removeMuterRole } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'muter',
  aliases: [],
  description: 'Manage roles that can use voice mute commands',
  usage: 'add <@role|roleID|rolename>',
  category: 'Setup Commands',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(sub)) {
      return card(message, {
        title: 'Muter Roles',
        lines: [
          '__Manage roles that can use voice mute commands__',
          '__`&muter add <@role|roleID|rolename>`__',
          '__`&muter remove <@role|roleID|rolename>`__',
          '__`&muter list`__',
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    const config = await getGuildConfig(message.guild.id);

    if (sub === 'list') {
      const roles = (config.muterRoleIds || []).map((id) => message.guild.roles.cache.get(id)).filter(Boolean);
      return card(message, {
        title: 'Muter Roles',
        lines: roles.length ? roles.map((r) => `${r}`) : ['__No muter roles configured__'],
      });
    }

    const role = resolveRole(message, args.slice(1).join(' '));
    if (!role) return notice(message, "__Couldn't find that role__");

    if (sub === 'add') {
      await addMuterRole(message.guild.id, role.id);
      return card(message, { title: 'Muter Roles', lines: [`__Added__ ${role} __as a muter role__`] });
    }

    await removeMuterRole(message.guild.id, role.id);
    return card(message, { title: 'Muter Roles', lines: [`__Removed__ ${role} __as a muter role__`] });
  },
};
