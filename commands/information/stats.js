const { textBlock, divider, notice, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { SERVER_EMOJI, TICKET_EMOJI, STATS_EMOJI } = require('../../utils/emojis');

const emojiOf = (text) => {
  const [, animated, name, id] = text.match(/<(a?):(\w+):(\d+)>/);
  return { id, name, animated: Boolean(animated) };
};
const button = (customId, label, emoji) => ({ type: 2, custom_id: customId, style: 2, label, disabled: true, emoji: emojiOf(emoji) });

const withIcon = (url, text) => (url
  ? { type: 9, components: [text], accessory: { type: 11, media: { url }, description: null, spoiler: false } }
  : text);

module.exports = {
  name: 'stats',
  aliases: [],
  description: 'Shows server statistics',
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    const guild = message.guild;
    if (!guild) return notice(message, '__This command only works inside a server__');

    const members = guild.memberCount;
    const inVoice = guild.voiceStates.cache.filter((state) => state.channelId).size;
    const boosts = guild.premiumSubscriptionCount || 0;
    const full = guild.icon ? guild : await guild.fetch().catch(() => guild);
    const icon = full.iconURL({ size: 256 });

    return message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          textBlock(`## ${STATS_EMOJI.title} ${guild.name} Stats`),
          divider(),
          withIcon(icon, textBlock([
            `${SERVER_EMOJI.members} **Members** ⟿ **\`${members}\`**`,
            `${SERVER_EMOJI.voice} **In Voice** ⟿ **\`${inVoice}\`**`,
            `${SERVER_EMOJI.boost} **Boosts** ⟿ **\`${boosts}\`**`,
          ].join('\n\n'))),
          divider(),
          {
            type: 1,
            components: [
              button('stats_members', `Members • ${members}`, SERVER_EMOJI.members),
              button('stats_voice', `In Voice • ${inVoice}`, SERVER_EMOJI.voice),
            ],
          },
          divider(),
          textBlock(`-# ${TICKET_EMOJI.footer}  .ᐟ Server Live Stats`),
        ],
        spoiler: false,
      }],
      allowedMentions: { repliedUser: true, parse: [] },
    });
  },
};
