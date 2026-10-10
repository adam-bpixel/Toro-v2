const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../models/core/moderation');
const { resolveChannel } = require('../../models/economy/clans');
const { card, notice, usageCard } = require('../../utils/render/embeds');

const TITLE = 'Verification Logs';
const TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

module.exports = {
  name: 'setveriflogs',
  aliases: [],
  description: 'Set the channel where &vb / &vg are logged',
  usage: '<#channel|off>',
  category: 'Setup Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }
    const config = await getGuildConfig(message.guild.id);
    if (!args.length) {
      const id = config.verification?.logChannelId;
      const current = id && message.guild.channels.cache.get(id);
      return usageCard(message, {
        summary: 'Set the channel where &vb / &vg are logged',
        usage: '&setveriflogs <#channel|off>',
        notes: [current ? `Current: ${current}` : 'Current: off'],
      });
    }

    const query = args.join(' ');
    if (['off', 'none', 'remove'].includes(query.toLowerCase())) {
      await updateGuildConfig(message.guild.id, { $set: { 'verification.logChannelId': null } });
      return card(message, { title: TITLE, lines: ['__Verification logs turned off__'] });
    }
    const channel = resolveChannel(message, query, TYPES);
    if (!channel) return notice(message, "__Couldn't find that text channel__");
    await updateGuildConfig(message.guild.id, { $set: { 'verification.logChannelId': channel.id } });
    return card(message, { title: TITLE, lines: [`__Verification logs will be sent to__ ${channel}`] });
  },
};
