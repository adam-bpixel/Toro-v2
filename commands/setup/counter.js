const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildConfig, setCounter, removeCounter } = require('../../models/core/moderation');
const { card, notice } = require('../../utils/render/embeds');
const { updateCounter } = require('../../handlers/setup/counters');

const DEFAULT_FORMAT = '👥・Members : {count}';

function resolveVoiceChannel(message, query) {
  if (!message.guild || !query) return null;
  const id = (query.match(/^<#(\d+)>$/) || [])[1] || (/^\d{15,25}$/.test(query) ? query : null);
  const channel = id
    ? message.guild.channels.cache.get(id)
    : message.guild.channels.cache.find((c) => c.name.toLowerCase() === query.replace(/^#/, '').toLowerCase());
  return channel && (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) ? channel : null;
}

module.exports = {
  name: 'counter',
  aliases: [],
  description: 'Setup member and voice counter channels',
  usage: 'show',
  category: 'Setup Commands',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['show', 'members', 'voice'].includes(sub)) {
      return card(message, {
        title: 'Counter',
        lines: [
          '__Setup member and voice counter channels__',
          '__`&counter show`__',
          '__`&counter members set <channel> [format]`__',
          '__`&counter members remove`__',
          '__`&counter voice set <channel> [format]`__',
          '__`&counter voice remove`__',
          '__Use `{count}` in format as placeholder__',
        ],
      });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }

    const config = await getGuildConfig(message.guild.id);

    if (sub === 'show') {
      const counters = config.counters || {};
      const line = (name, settings) => {
        const channel = settings && message.guild.channels.cache.get(settings.channelId);
        return `- __${name} Counter__ : ${channel ? `${channel} \`${settings.format}\`` : '`Not set`'}`;
      };
      return card(message, { title: 'Counter', lines: [line('Members', counters.members), line('Voice', counters.voice)] });
    }

    if (sub === 'voice') return notice(message, '__This is not set up yet__');

    const kind = (args[1] || '').toLowerCase();
    if (kind === 'remove') {
      await removeCounter(message.guild.id, 'members');
      return card(message, { title: 'Counter', lines: ['__Members counter removed__'] });
    }
    if (kind !== 'set') {
      return notice(message, '__Use `&counter members set <channel> [format]` or `&counter members remove`__');
    }

    const rest = args.slice(2);
    const channel = resolveVoiceChannel(message, rest[0]);
    if (!channel) return notice(message, "__Couldn't find that voice channel__");
    const format = rest.slice(1).join(' ') || DEFAULT_FORMAT;
    if (!format.includes('{count}')) return notice(message, '__The format must include `{count}`__');

    const me = message.guild.members.me;
    if (!me.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels)) {
      return notice(message, `__I need the **Manage Channels** permission in__ ${channel}`);
    }

    await setCounter(message.guild.id, 'members', { channelId: channel.id, format });
    updateCounter(message.guild, 'members').catch(() => {});
    return card(message, { title: 'Counter', lines: [`__Members counter set to__ ${channel}`, `__Format__ : \`${format}\``] });
  },
};
