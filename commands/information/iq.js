const { resolveUser } = require('../../utils/access/resolve');
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider } = require('../../utils/render/embeds');
const { IQ_EMOJI } = require('../../utils/emojis');

const VERDICTS = [
  [180, 'A certified genius'],
  [150, 'Brilliant mind'],
  [120, 'Pretty smart'],
  [90, 'Perfectly average'],
  [0, 'Needs a nap'],
];

module.exports = {
  name: 'iq',
  aliases: [],
  description: 'Check IQ',
  usage: '[ID|@member|username]',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    const target = await resolveUser(message, args);
    const iq = Math.floor(Math.random() * 151) + 50;
    const [, verdict] = VERDICTS.find(([min]) => iq >= min);

    await message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          textBlock(`## ${IQ_EMOJI.title} IQ Machine`),
          divider(),
          {
            type: 9,
            components: [textBlock([
              `${IQ_EMOJI.user} **${target.username}**`,
              `${IQ_EMOJI.score} IQ ⁘ **${iq}**`,
              `${IQ_EMOJI.verdict} ${verdict}`,
            ].join('\n'))],
            accessory: { type: 11, media: { url: target.displayAvatarURL({ size: 256 }) } },
          },
          divider(),
          textBlock(`-# Requested by ${message.author.username}`),
        ],
      }],
      allowedMentions: { repliedUser: false },
    });
  },
};
