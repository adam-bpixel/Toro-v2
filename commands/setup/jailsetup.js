const { PermissionFlagsBits } = require('discord.js');
const { resolveRole } = require('../../utils/access/resolve');
const { getGuildConfig, setJailRole } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'jailsetup',
  aliases: [],
  description: 'Setup the jail role',
  usage: '<@role|role ID|role name>',
  category: 'Setup Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Jail Setup',
        lines: ['__`&jailsetup <@role|role ID|role name>`__', '__`&jailsetup show`__'],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    if (args[0].toLowerCase() === 'show') {
      const config = await getGuildConfig(message.guild.id);
      const role = config.jailRoleId ? message.guild.roles.cache.get(config.jailRoleId) : null;
      return card(message, {
        title: 'Jail Setup',
        lines: [role ? `__Jail role__ : ${role}` : '__No jail role configured yet__'],
      });
    }

    const role = resolveRole(message, args.join(' '));
    if (!role) return notice(message, "__Couldn't find that role__");

    await setJailRole(message.guild.id, role.id);
    await card(message, { title: 'Jail Setup', lines: [`__Jail role set to__ ${role}`] });
  },
};
