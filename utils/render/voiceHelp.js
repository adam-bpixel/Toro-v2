'use strict';
const { ACCENT_COLOR, COMPONENTS_V2, divider, textBlock } = require('./embeds');
const { VOICE_EMOJI } = require('../emojis');

const HELP_BANNER = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&';

const HELP_LINES = [
  ['lock', 'lock', '', 'Lock your channel (deny connect for everyone)'],
  ['unlock', 'unlock', '', 'Unlock your channel'],
  ['ghost', 'ghost', '', 'Hide your channel from everyone'],
  ['reveal', 'reveal', '', 'Make your channel visible again'],
  ['name', 'name', ' <name>', 'Rename your channel (max 100 chars)'],
  ['limit', 'limit', ' <0-99>', 'Set user limit (0 = unlimited)'],
  ['claim', 'claim', '', 'Claim ownership if the owner left'],
  ['kick', 'kick', ' <@user|ID|username>', 'Disconnect a member from your VC'],
  ['deny', 'kick', ' <@user|ID|username>', 'Kick a member and stop them from joining again'],
  ['perm', 'unlock', ' <@user|@role>', 'Let a member or role join, even if locked or hidden'],
  ['panel', 'title', '', 'Send the control panel again in your VC'],
  ['activity', 'activity', '', 'Toggle embedded activities in your VC'],
  ['owner', 'owner', '', 'Show who owns this channel'],
  ['info', 'owner', '', 'Show the channel information'],
];

function buildVoiceHelpPanel(prefix) {
  const lines = [
    `- __The Command is \`${prefix}voice\`__`,
    ...HELP_LINES.map(([name, icon, usage, what]) => `- ${VOICE_EMOJI[icon]} | __\`${prefix}voice ${name}${usage}\` — ${what}__`),
  ];

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${VOICE_EMOJI.title} Voice Control – Help`),
        divider(),
        { type: 12, items: [{ media: { url: HELP_BANNER }, description: null, spoiler: false }] },
        divider(),
        textBlock(lines.join('\n')),
        divider(),
      ],
      spoiler: false,
    }],
    allowedMentions: { repliedUser: true },
  };
}

module.exports = {
  HELP_LINES,
  buildVoiceHelpPanel,
};
