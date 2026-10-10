const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setAutoRoles } = require('../../models/core/moderation');
const { rejectionReason, savedIds, MAX_AUTOROLES } = require('../../handlers/roles/autoroleSetup');
const { resolveRole } = require('../../utils/access/resolve');
const { replay } = require('../../utils/runtime/replay');
const { card, notice } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'autorole',
  aliases: [],
  description: '',
  usage: 'General Autoroles:',
  category: 'Setup Commands',
  recorded: {
    replies: [
      {
        content: '',
        embeds: [],
        components: [
          {
            type: 17,
            accent_color: 13944790,
            components: [
              { type: 10, content: '## Command' },
              { type: 14, spacing: 1, divider: true },
              { type: 10, content: '- __Configure auto-role settings__  ⁘' },
              { type: 14, spacing: 1, divider: true },
              { type: 10, content: '## Usage' },
              { type: 14, spacing: 1, divider: true },
              {
                type: 10,
                content:
                  '**General Autoroles:**\n- __`&autorole add <@role|roleID|rolename>`__  ⁘\n- __`&autorole remove <@role|roleID|rolename>`__  ⁘\n- __`&autorole clear`__  ⁘\n\n**Invite Autoroles:**\n- __`&autorole invite add <code> <@role>`__  ⁘\n- __`&autorole invite remove <code|@role>`__  ⁘\n- __Max: 2 roles per invite, 3 invites__  ⁘\n\n**Other:**\n- __`&autorole list`__  ⁘\n- __Cooldown: 30 seconds__  ⁘',
              },
            ],
            spoiler: false,
          },
        ],
        v2: true,
        attachments: [],
        reply: true,
        ping: true,
      },
    ],
    reactions: [],
  },
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'clear', 'list'].includes(sub)) return replay(message, this, args);
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, '__You need the Administrator permission to change auto roles__');
    }

    const ids = savedIds(await getGuildConfig(message.guild.id));

    if (sub === 'list') {
      const list = ids.length ? ids.map((id) => `<@&${id}>`) : ['__No autoroles configured__'];
      return card(message, { title: 'Auto Role', lines: [`__Current Autoroles ${ids.length}/${MAX_AUTOROLES} :__`, ...list] });
    }

    if (sub === 'clear') {
      if (!ids.length) return notice(message, '__There are no auto roles to remove__');
      await setAutoRoles(message.guild.id, []);
      return card(message, { title: `${EMOJI.success} Auto Role`, lines: ['__Cleared all autoroles__'] });
    }

    const query = args.slice(1).join(' ');
    if (!query) return replay(message, this, []);
    const role = resolveRole(message, query);
    if (!role) return notice(message, '__Role not found__');

    if (sub === 'remove') {
      if (!ids.includes(role.id)) return notice(message, `${role} __is not an auto role__`);
      await setAutoRoles(message.guild.id, ids.filter((id) => id !== role.id));
      return card(message, { title: `${EMOJI.success} Auto Role`, lines: [`__Removed__ ${role} __from autoroles__`] });
    }

    if (ids.length >= MAX_AUTOROLES) {
      return notice(message, `__You already have ${MAX_AUTOROLES}/${MAX_AUTOROLES} auto roles - remove one first__`);
    }
    const reason = rejectionReason({ guild: message.guild, user: message.author, member: message.member }, role, ids);
    if (reason) return notice(message, [`__Skipped__ : ${role}`, `__Reason__ : ${reason}`]);
    await setAutoRoles(message.guild.id, [...ids, role.id]);
    return card(message, { title: `${EMOJI.success} Auto Role`, lines: [`__Added__ ${role} __to autoroles__`] });
  },
};
