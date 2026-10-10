const { PermissionFlagsBits } = require('discord.js');
const { resolveRole } = require('../../utils/access/resolve');
const { getGuildConfig } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const TITLE = 'Clan Manager Command';

module.exports = {
  name: 'clanmanager',
  aliases: ['clan-manager'],
  description: 'Configure clan manager roles',
  usage: 'add <@role|roleID|rolename>',
  category: 'Setup Commands',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(sub)) {
      return card(message, {
        title: TITLE,
        lines: [
          '__`&clanmanager add <@role|roleID|rolename>`__',
          '__`&clanmanager remove <@role|roleID|rolename>`__',
          '__`&clanmanager list`__',
          `__Max ${clans.MAX_MANAGER_ROLES} roles__`,
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    const { guild } = message;
    const current = clans.managerRoleIds(await getGuildConfig(guild.id));

    if (sub === 'list') {
      const roles = current.map((id) => guild.roles.cache.get(id)).filter(Boolean);
      return card(message, {
        title: TITLE,
        lines: roles.length ? roles.map((role) => `${role}`) : ['__No clan manager roles configured__'],
      });
    }

    const role = resolveRole(message, args.slice(1).join(' '));
    if (!role) return notice(message, "__Couldn't find that role__");

    if (sub === 'add') {
      if (role.id === guild.id) return notice(message, "__@everyone can't be a clan manager role__");
      if (current.includes(role.id)) return notice(message, `__${role} is already a clan manager role__`);
      if (current.length >= clans.MAX_MANAGER_ROLES) return notice(message, `__Max ${clans.MAX_MANAGER_ROLES} roles__`);
      await clans.addManagerRole(guild.id, role.id);
      return card(message, { title: TITLE, lines: [`__Added__ ${role} __as a clan manager role__`] });
    }

    if (!current.includes(role.id)) return notice(message, `__${role} isn't a clan manager role__`);
    await clans.removeManagerRole(guild.id, role.id);
    return card(message, { title: TITLE, lines: [`__Removed__ ${role} __as a clan manager role__`] });
  },
};
