const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, getCommandRestriction, setCommandRestriction } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');

const UNRESTRICTABLE = new Set(['setup', 'command']);

function resolveCommandName(client, query) {
  if (!query) return null;
  const lower = query.toLowerCase();
  if (client.commands.has(lower)) return lower;
  return client.aliases.get(lower) || null;
}

function resolveChannel(message, query) {
  if (!message.guild || !query) return null;
  const id = (query.match(/^<#(\d+)>$/) || [])[1] || (/^\d{15,25}$/.test(query) ? query : null);
  if (id) return message.guild.channels.cache.get(id) || null;
  const clean = query.replace(/^#/, '').toLowerCase();
  return message.guild.channels.cache.find((c) => c.name.toLowerCase() === clean) || null;
}

function describe(restriction) {
  const parts = [];
  if (restriction.disabledGlobally) parts.push('disabled server-wide');
  if (restriction.disabledChannelIds.length) parts.push(`disabled in ${restriction.disabledChannelIds.map((id) => `<#${id}>`).join(' ')}`);
  if (restriction.allowedChannelIds.length) parts.push(`allowed in ${restriction.allowedChannelIds.map((id) => `<#${id}>`).join(' ')}`);
  return parts.join(', ');
}

module.exports = {
  name: 'command',
  aliases: ['cmd'],
  description: 'Manage command restrictions',
  usage: 'disable <command> [#channel]',
  category: 'Setup Commands',
  async execute(message, args, client) {
    const sub = (args[0] || '').toLowerCase();
    if (!['disable', 'enable', 'allow', 'disallow', 'list'].includes(sub)) {
      return card(message, {
        title: 'Command',
        lines: [
          '__Manage command restrictions__',
          '__`&command disable <command> [#channel]`__',
          '__`&command enable <command> [#channel]`__',
          '__`&command allow <command> <#channel>`__',
          '__`&command disallow <command>`__',
          '__`&command list`__',
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    if (sub === 'list') {
      const config = await getGuildConfig(message.guild.id);
      const entries = Object.entries(config.commandRestrictions || {})
        .filter(([, r]) => r.disabledGlobally || (r.disabledChannelIds || []).length || (r.allowedChannelIds || []).length);
      if (!entries.length) return card(message, { title: 'Command', lines: ['__No command restrictions configured__'] });
      return card(message, {
        title: 'Command',
        lines: entries.map(([name, r]) => `- __\`${name}\`__ : ${describe({ disabledChannelIds: [], allowedChannelIds: [], ...r })}`),
      });
    }

    const commandName = resolveCommandName(client, args[1]);
    if (!commandName) return notice(message, "__Couldn't find that command__");
    if (UNRESTRICTABLE.has(commandName)) return notice(message, `__\`${commandName}\` can't be restricted__`);

    const restriction = await getCommandRestriction(message.guild.id, commandName);
    const channelQuery = args.slice(2).join(' ');
    const channel = channelQuery ? resolveChannel(message, channelQuery) : null;
    if (channelQuery && !channel) return notice(message, "__Couldn't find that channel__");

    if (sub === 'disable') {
      if (channel) restriction.disabledChannelIds = [...new Set([...restriction.disabledChannelIds, channel.id])];
      else restriction.disabledGlobally = true;
      await setCommandRestriction(message.guild.id, commandName, restriction);
      return card(message, { title: 'Command', lines: [`__\`${commandName}\` disabled__ ${channel ? `in ${channel}` : 'server-wide'}`] });
    }

    if (sub === 'enable') {
      if (channel) {
        restriction.disabledChannelIds = restriction.disabledChannelIds.filter((id) => id !== channel.id);
      } else {
        restriction.disabledGlobally = false;
        restriction.disabledChannelIds = [];
        restriction.allowedChannelIds = [];
      }
      await setCommandRestriction(message.guild.id, commandName, restriction);
      return card(message, { title: 'Command', lines: [`__\`${commandName}\` enabled__ ${channel ? `in ${channel}` : 'server-wide'}`] });
    }

    if (sub === 'allow') {
      if (!channel) return notice(message, '__`&command allow <command> <#channel>` needs a channel__');
      restriction.allowedChannelIds = [...new Set([...restriction.allowedChannelIds, channel.id])];
      await setCommandRestriction(message.guild.id, commandName, restriction);
      return card(message, { title: 'Command', lines: [`__\`${commandName}\` allowed in__ ${channel}`] });
    }

    restriction.allowedChannelIds = [];
    await setCommandRestriction(message.guild.id, commandName, restriction);
    return card(message, { title: 'Command', lines: [`__Cleared allowed channels for__ \`${commandName}\``] });
  },
};
