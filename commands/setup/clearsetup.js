const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildConfig, setClearSkipChannels } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');

const MAX_SKIP_CHANNELS = 25;
const CLEARABLE = new Set([ChannelType.GuildText, ChannelType.GuildAnnouncement]);

function resolveChannelOrCategory(message, query) {
  if (!message.guild || !query) return null;
  const id = (query.match(/^<#(\d+)>$/) || [])[1] || (/^\d{15,25}$/.test(query) ? query : null);
  if (id) return message.guild.channels.cache.get(id) || null;
  const clean = query.replace(/^#/, '').toLowerCase();
  return message.guild.channels.cache.find((c) => c.name.toLowerCase() === clean)
    || message.guild.channels.cache.find((c) => c.name.toLowerCase().startsWith(clean))
    || null;
}

function channelsOf(guild, target) {
  if (target.type !== ChannelType.GuildCategory) return [target];
  return [...guild.channels.cache.filter((c) => c.parentId === target.id && CLEARABLE.has(c.type)).values()];
}

module.exports = {
  name: 'clearsetup',
  aliases: [],
  description: 'Configure channels where &clear is skipped',
  usage: 'add <#channel|category_id|category_name>',
  category: 'Setup Commands',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(sub)) {
      return card(message, {
        title: 'Clear Skip',
        lines: [
          '__Configure channels to skip when using the clear command__',
          '__`&clearsetup add <#channel|category_id|category_name>`__',
          '__`&clearsetup remove <#channel|category_id|category_name>`__',
          '__`&clearsetup list`__',
          `__Max ${MAX_SKIP_CHANNELS} skip channels__`,
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    const config = await getGuildConfig(message.guild.id);

    if (sub === 'list') {
      const ids = config.clearSkipChannelIds || [];
      return card(message, {
        title: 'Clear Skip',
        lines: ids.length ? ids.map((id) => `<#${id}>`) : ['__No skip channels configured__'],
      });
    }

    const target = resolveChannelOrCategory(message, args.slice(1).join(' '));
    if (!target) return notice(message, "__Couldn't find that channel or category__");
    const channels = channelsOf(message.guild, target);
    if (!channels.length) return notice(message, '__That category has no text channels__');

    const current = config.clearSkipChannelIds || [];
    if (sub === 'add') {
      const next = [...current];
      const added = [];
      const full = [];
      for (const channel of channels) {
        if (next.includes(channel.id)) continue;
        if (next.length >= MAX_SKIP_CHANNELS) { full.push(channel); continue; }
        next.push(channel.id);
        added.push(channel);
      }
      if (added.length) await setClearSkipChannels(message.guild.id, next);
      const lines = [];
      if (added.length) lines.push(`__Added__ ${added.map((c) => `${c}`).join(' ')}`);
      if (full.length) lines.push(`__Skipped (limit of ${MAX_SKIP_CHANNELS} reached)__ : ${full.map((c) => `${c}`).join(' ')}`);
      return card(message, { title: 'Clear Skip', lines: lines.length ? lines : ['__Already added__'] });
    }

    const removeIds = new Set(channels.map((c) => c.id));
    const next = current.filter((id) => !removeIds.has(id));
    await setClearSkipChannels(message.guild.id, next);
    return card(message, { title: 'Clear Skip', lines: [`__Removed__ ${channels.map((c) => `${c}`).join(' ')}`] });
  },
};
