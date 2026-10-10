'use strict';
const { ChannelType } = require('discord.js');
const { ACCENT_COLOR } = require('../../utils/render/embeds');
const { EMOJI, SERVER_EMOJI } = require('../../utils/emojis');
const { comma } = require('../../utils/format');
const { isPremium } = require('../../models/economy/premium');

function countChannels(guild) {
  const cache = guild.channels.cache;
  return {
    text: cache.filter((c) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).size,
    voice: cache.filter((c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).size,
    categories: cache.filter((c) => c.type === ChannelType.GuildCategory).size,
    threads: cache.filter((c) => c.isThread()).size,
    total: cache.size,
  };
}

module.exports = {
  name: 'server',
  aliases: ['guild', 's', 'si', 'guildinfo', 'idsserver'],
  description: "View this server's info",
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    const guild = message.guild;
    if (!guild) {
      return message.reply({ content: "__This command only works inside a server__", allowedMentions: { repliedUser: false } });
    }

    const owner = await guild.fetchOwner().catch(() => null);
    const premium = await isPremium('server', guild.id);
    const channels = countChannels(guild);
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const iconURL = guild.iconURL({ extension: 'png', size: 1024, forceStatic: false });
    const bannerURL = guild.bannerURL({ extension: 'png', size: 512, forceStatic: false });

    const embed = {
      type: 'rich',
      description: guild.description || `Welcome to **${guild.name}**!`,
      color: ACCENT_COLOR,
      fields: [
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: owner ? `${owner.user} ${SERVER_EMOJI.ownership}` : '*Unknown*', inline: true },
        { name: 'Shard', value: `#${guild.shardId + 1}`, inline: true },
        { name: 'Premium Status', value: premium ? `${EMOJI.premiumActive} Activated` : `${EMOJI.premiumFree} Not Activated`, inline: true },
        {
          name: 'Server Members',
          value: `${SERVER_EMOJI.members} ${comma(guild.memberCount)} Total\n${SERVER_EMOJI.bot} ${comma(bots)} Bots`,
        },
        {
          name: 'Channels',
          value: [
            `${SERVER_EMOJI.text} ${channels.text} Text`,
            `${SERVER_EMOJI.voice} ${channels.voice} Voice`,
            `${SERVER_EMOJI.category} ${channels.categories} Categories`,
            `${SERVER_EMOJI.thread} ${channels.threads} Threads`,
            `${SERVER_EMOJI.channels} ${channels.total} Total`,
          ].join('\n'),
        },
        { name: 'Server Region', value: `${SERVER_EMOJI.region} ${guild.preferredLocale}`, inline: true },
        { name: 'Roles', value: `${SERVER_EMOJI.link} ${guild.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${SERVER_EMOJI.emoji} ${guild.emojis.cache.size}`, inline: true },
        { name: 'Stickers', value: `${SERVER_EMOJI.sticker} ${guild.stickers.cache.size}`, inline: true },
        { name: 'Verification', value: String(guild.verificationLevel), inline: true },
        {
          name: 'Boost Count',
          value: `${SERVER_EMOJI.boost} ${comma(guild.premiumSubscriptionCount || 0)} (Level ${guild.premiumTier})`,
          inline: true,
        },
        {
          name: 'Vanity URL',
          value: guild.vanityURLCode ? `${SERVER_EMOJI.link} discord.gg/${guild.vanityURLCode}` : '*None*',
          inline: true,
        },
        { name: 'Server Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` },
      ],
      author: { name: guild.name, icon_url: iconURL || undefined },
      thumbnail: iconURL ? { url: iconURL } : undefined,
      image: bannerURL ? { url: bannerURL } : undefined,
      footer: {
        text: `Server • Requested by ${message.author.username}`,
        icon_url: message.author.displayAvatarURL({ extension: 'png', size: 128 }),
      },
    };

    await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  },
};
