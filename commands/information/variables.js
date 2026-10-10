const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider } = require('../../utils/render/embeds');
const { localize } = require('../../utils/localize');

const ICON = '<:vartoro:1553493573201174690>';

const SECTIONS = {
  guild: {
    title: 'Guild Variables',
    groups: [
      ["`{guild.name}` - The guild's name", "`{guild.id}` - The guild's ID", "`{guild.count}` - The guild's member count", "`{guild.region}` - The guild's preferred locale", "`{guild.shard}` - The guild's shard ID"],
      ["`{guild.owner_id}` - The guild owner's ID", "`{guild.created_at}` - The guild's creation date in UTC", "`{guild.created_at_timestamp}` - The guild's creation date in UNIX", "`{guild.emoji_count}` - The guild's emoji count", "`{guild.role_count}` - The guild's role count"],
      ["`{guild.boost_count}` - The guild's boost count", "`{guild.boost_tier}` - The guild's boost tier level", "`{guild.preferred_locale}` - The guild's preferred locale", "`{guild.key_features}` - The guild's key features", "`{guild.icon}` - The guild's icon URL"],
      ["`{guild.banner}` - The guild's banner URL", "`{guild.splash}` - The guild's splash URL", "`{guild.discovery}` - The guild's discovery splash URL", "`{guild.max_presences}` - The guild's maximum presences", "`{guild.max_members}` - The guild's maximum members"],
      ["`{guild.max_video_channel_users}` - The guild's max video channel users", "`{guild.afk_timeout}` - The guild's AFK timeout", "`{guild.afk_channel}` - The guild's AFK channel name", "`{guild.channels}` - The guild's channel list", "`{guild.channels_count}` - The guild's channel count"],
      ["`{guild.text_channels}` - The guild's text channel list", "`{guild.text_channels_count}` - The guild's text channel count", "`{guild.voice_channels}` - The guild's voice channel list", "`{guild.voice_channels_count}` - The guild's voice channel count", "`{guild.category_channels}` - The guild's category channel list"],
      ["`{guild.category_channels_count}` - The guild's category channel count", "`{guild.vanity}` - The guild's vanity URL code"],
    ],
  },
  user: {
    title: 'User Variables',
    groups: [
      ["`{user}` - The user's name and discriminator", "`{user.id}` - The user's ID", "`{user.mention}` - The user's mention", "`{user.name}` - The user's name", "`{user.tag}` - The user's discriminator"],
      ["`{user.avatar}` - The user's profile picture", "`{user.guild_avatar}` - The user's guild profile picture", "`{user.display_avatar}` - The user's available profile picture", "`{user.joined_at}` - The user's guild join date in UTC", "`{user.joined_at_timestamp}` - The user's guild join date in UNIX"],
      ["`{user.created_at}` - The user's account creation date in UTC", "`{user.created_at_timestamp}` - The user's account creation date in UNIX", "`{user.display_name}` - The user's current display name", "`{user.boost}` - Yes/No if the user is boosting the guild", "`{user.boost_since}` - The user's initial guild boost date"],
      ["`{user.boost_since_timestamp}` - The user's initial guild boost date in UNIX", "`{user.color}` - The user's top role hex code", "`{user.top_role}` - The user's top role name, defaults to N/A", "`{user.role_list}` - The user's role list (possibly N/A)", "`{user.role_text_list}` - The user's role list in text (possibly N/A)"],
      ["`{user.bot}` - Yes/No if the user is a bot", "`{user.join_position}` - The user's join position in the guild", "`{user.join_position_suffix}` - The user's join position with suffix (1st, 2nd, 3rd, etc.)"],
    ],
  },
  channel: {
    title: 'Channel Variables',
    groups: [
      ["`{channel.name}` - The channel's name", "`{channel.id}` - The channel's ID", "`{channel.mention}` - The channel's mention", "`{channel.topic}` - The channel's topic", "`{channel.type}` - The channel's type (text/news/..)"],
      ["`{channel.category_id}` - The channel's category ID (possibly N/A)", "`{channel.category_name}` - The channel's category name (possibly N/A)", "`{channel.position}` - The channel's position in the guild channel list", "`{channel.slowmode_delay}` - The channel's slowmode delay in seconds (defaults to 0)"],
    ],
  },
  time: {
    title: 'Date & Time Variables',
    groups: [
      ["`{date.now}` - Current date in PST", "`{date.utc_timestamp}` - Current date as UNIX", "`{date.now_proper}` - Better formatted date in PST", "`{date.now_short}` - Short formatted date in PST", "`{date.now_shorter}` - Shorter formatted date in PST"],
      ["`{time.now}` - 12 hour timestamp in PST", "`{time.now_military}` - 24 hour timestamp in PST", "`{date.utc_now}` - Current date in UTC", "`{date.utc_now_proper}` - Better formatted date in UTC", "`{date.utc_now_short}` - Short formatted date in UTC"],
      ["`{date.utc_now_shorter}` - Shorter formatted date in UTC", "`{time.utc_now}` - 12 hour timestamp in UTC", "`{time.utc_now_military}` - 24 hour timestamp in UTC"],
    ],
  },
};

const helpCard = () => ({
  flags: COMPONENTS_V2,
  components: [{
    type: 17,
    accent_color: ACCENT_COLOR,
    components: [
      textBlock('## Command'),
      divider(),
      textBlock('- __Display all available variables for the system__  ⁘'),
      divider(),
      textBlock('## Usage'),
      divider(),
      textBlock([
        '- __`&variables guild`__ - Show guild variables',
        '- __`&variables user`__ - Show user variables',
        '- __`&variables channel`__ - Show channel variables',
        '- __`&variables time`__ - Show date & time variables',
      ].join('\n')),
    ],
    spoiler: false,
  }],
});

module.exports = {
  name: 'variables',
  aliases: ['vars'],
  description: 'Display all available variables for the system',
  usage: '<guild|user|channel|time>',
  category: 'Information Commands',
  async execute(message, args) {
    const section = SECTIONS[(args[0] || '').toLowerCase()];
    if (!section) return message.reply(await localize(message, { ...helpCard(), allowedMentions: { repliedUser: true } }));

    return message.reply({
      embeds: [{
        title: `${ICON} **${section.title}**`,
        color: ACCENT_COLOR,
        fields: section.groups.map((lines) => ({ name: '​', value: lines.map((line) => `- ${line}`).join('\n'), inline: false })),
      }],
      allowedMentions: { repliedUser: true },
    });
  },
};
