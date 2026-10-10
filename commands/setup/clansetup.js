const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const TITLE = 'Clan Setup';
const KIND_NAMES = { leader: 'leader', coleader: 'co-leader' };

module.exports = {
  name: 'clansetup',
  aliases: [],
  description: 'Setup clan system',
  usage: 'leader <@role|roleID|rolename>',
  category: 'Setup Commands',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['leader', 'coleader', 'remove', 'list', 'log'].includes(sub)) {
      return card(message, {
        title: TITLE,
        lines: [
          '__Configure clan system roles__',
          '__`&clansetup leader <@role|roleID|rolename>`__',
          '__`&clansetup coleader <@role|roleID|rolename>`__',
          '__`&clansetup remove <leader|coleader>`__',
          '__`&clansetup log <#channel|off>`__',
          '__`&clansetup list`__',
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    const { guild } = message;
    const config = await getGuildConfig(guild.id);
    const shown = (kind) => {
      const roleId = clans.setupRoleId(config, kind);
      return roleId && guild.roles.cache.has(roleId) ? `<@&${roleId}>` : '__Not set__';
    };

    if (sub === 'list') {
      return card(message, {
        title: TITLE,
        lines: [
          `__Leader role__ : ${shown('leader')}`,
          `__Co-leader role__ : ${shown('coleader')}`,
          `__Log channel__ : ${config.clanLogChannelId && guild.channels.cache.has(config.clanLogChannelId) ? `<#${config.clanLogChannelId}>` : '__Not set__'}`,
        ],
      });
    }

    if (sub === 'log') {
      const query = args.slice(1).join(' ');
      if (['off', 'none', 'remove'].includes(query.toLowerCase())) {
        await clans.setLogChannel(guild.id, null);
        return card(message, { title: TITLE, lines: ['__Removed the clan log channel__'] });
      }
      const channel = clans.resolveChannel(message, query, [ChannelType.GuildText, ChannelType.GuildAnnouncement]);
      if (!channel) return notice(message, "__Couldn't find that text channel__");
      await clans.setLogChannel(guild.id, channel.id);
      return card(message, { title: TITLE, lines: [`__Clan logs will be sent to__ ${channel}`] });
    }

    if (sub === 'remove') {
      const kind = (args[1] || '').toLowerCase();
      if (!KIND_NAMES[kind]) return notice(message, '__Use `&clansetup remove <leader|coleader>`__');
      const previous = clans.setupRoleId(config, kind);
      if (!previous) return notice(message, `__No ${KIND_NAMES[kind]} role is configured__`);
      await clans.setSetupRole(guild.id, kind, null);
      await clans.resyncRanks(guild, previous);
      return card(message, { title: TITLE, lines: [`__Removed the ${KIND_NAMES[kind]} role__`] });
    }

    return clans.configureSetupRole(message, sub, args.slice(1).join(' '));
  },
};
