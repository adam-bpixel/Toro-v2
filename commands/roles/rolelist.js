'use strict';
const { resolveRole } = require('../../utils/access/resolve');
const { card, notice, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI, TICKET_EMOJI } = require('../../utils/emojis');

const ONLINE_STATUSES = ['online', 'idle', 'dnd'];
const SHOWN = 100;

const divider = () => ({ type: 14, spacing: 1, divider: true });
const textBlock = (content) => ({ type: 10, content });

function mentionLines(members) {
  if (!members.length) return '__None__';
  return members.slice(0, SHOWN).map((m) => `${m}`).join(' ');
}

module.exports = {
  name: 'rolelist',
  aliases: [],
  description: 'Show a role\'s member count, online and offline members',
  usage: '<@role|roleID|rolename>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, { title: 'Role List Command', lines: ['__`&rolelist <@role|roleID|rolename>`__', '__Show a role\'s member, online and offline members__'] });
    }

    const role = resolveRole(message, args.join(' '));
    if (!role) return notice(message, "__Couldn't find that role__");

    const members = [...role.members.values()];
    const onlineMembers = members.filter((m) => m.presence && ONLINE_STATUSES.includes(m.presence.status));
    const offlineMembers = members.filter((m) => !onlineMembers.includes(m));

    await message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: role.color || ACCENT_COLOR,
        components: [
          textBlock(`## ${SETUP_EMOJI.param} ${role.name} Role List`),
          divider(),
          textBlock(`- ${SETUP_EMOJI.dropdown} __Member status breakdown for this role.__  ⁘`),
          divider(),
          textBlock([
            `- __Role :__ ${role}  ⁘`,
            `- __Members :__ **${members.length}**  ⁘`,
            `- __Online :__ **${onlineMembers.length}**  ⁘`,
            `- __Offline :__ **${offlineMembers.length}**  ⁘`,
          ].join('\n')),
          divider(),
          textBlock(`### Online ⟿ ${onlineMembers.length}`),
          textBlock(mentionLines(onlineMembers)),
          divider(),
          textBlock(`### Offline ⟿ ${offlineMembers.length}`),
          textBlock(mentionLines(offlineMembers)),
          divider(),
          textBlock(`-# ${TICKET_EMOJI.footer} ༯ Requested by ${message.author.username}`),
        ],
        spoiler: false,
      }],
      allowedMentions: { repliedUser: false, parse: [], users: [] },
    });
  },
};
