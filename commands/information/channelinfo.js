const { ChannelType } = require('discord.js');
const { ACCENT_COLOR } = require('../../utils/render/embeds');

const TYPE_NAMES = {
  [ChannelType.GuildText]: 'Text',
  [ChannelType.GuildVoice]: 'Voice',
  [ChannelType.GuildCategory]: 'Category',
  [ChannelType.GuildAnnouncement]: 'Announcement',
  [ChannelType.GuildStageVoice]: 'Stage',
  [ChannelType.GuildForum]: 'Forum',
  [ChannelType.PublicThread]: 'Thread',
  [ChannelType.PrivateThread]: 'Private Thread',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

function longDate(timestamp) {
  const d = new Date(timestamp);
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate())} ${d.getUTCFullYear()} ${time} GMT (Greenwich Mean Time Zone)`;
}

const block = (value) => `\`\`\`${String(value).replace(/`/g, 'ˋ').slice(0, 1000)}\`\`\``;

module.exports = {
  name: 'channelinfo',
  aliases: [],
  description: 'View information about a channel',
  usage: '[#channel]',
  category: 'Information Commands',
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.guild?.channels.cache.get(args[0]) || message.channel;
    const botIcon = message.client.user.displayAvatarURL({ size: 256 });

    await message.reply({
      embeds: [{
        color: ACCENT_COLOR,
        author: { name: 'Channel Information', icon_url: botIcon },
        fields: [
          { name: '**Name :**', value: block(channel.name), inline: true },
          { name: '**ID :**', value: block(channel.id), inline: true },
          { name: '**Type :**', value: block(TYPE_NAMES[channel.type] || 'Unknown'), inline: false },
          { name: '**Position :**', value: block(typeof channel.position === 'number' ? channel.position : 'None'), inline: true },
          { name: '**Category :**', value: block(channel.parent ? channel.parent.name : 'None'), inline: true },
          { name: '**NSFW :**', value: block('nsfw' in channel && channel.nsfw ? 'Yes' : 'No'), inline: true },
          { name: '**Topic :**', value: block(channel.topic || 'None'), inline: false },
          { name: '**Created At :**', value: block(longDate(channel.createdTimestamp)), inline: false },
        ],
        footer: { text: message.client.user.username, icon_url: botIcon },
      }],
      allowedMentions: { repliedUser: false },
    });
  },
};
