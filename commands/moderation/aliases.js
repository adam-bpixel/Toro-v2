const { replay } = require('../../utils/runtime/replay');
const { PermissionFlagsBits } = require('discord.js');
const { card, notice } = require('../../utils/render/embeds');
const { isPremium } = require('../../models/economy/premium');
const cooldown = require('../../utils/runtime/cooldown');
const aliases = require('../../models/settings/aliases');

module.exports = {
  name: "aliases",
  aliases: ['alias', 'cmdalias'],
  description: "",
  usage: ":",
  category: 'Moderation Commands',
  recorded: {
    "replies": [
      {
        "content": "",
        "embeds": [],
        "components": [
          {
            "type": 17,
            "accent_color": 13944790,
            "components": [
              {
                "type": 10,
                "content": "## Command"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __Manage command aliases__  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "## Usage"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "**Server Aliases:**\n- __`&aliases <add|remove|list> [alias] [command]`__  ⁘\n- __Cooldown: 30 seconds__  ⁘\n- __Max 3 aliases per command__  ⁘\n\n**Personal Aliases:**\n- __`&aliases self <add|remove|list> [alias] [command]`__  ⁘\n- __Works in all servers__  ⁘\n- __Max 3 aliases per command__  ⁘"
              }
            ],
            "spoiler": false
          }
        ],
        "v2": true,
        "attachments": [],
        "reply": true,
        "ping": true
      }
    ],
    "reactions": []
  },
  async execute(message, args, client) {
    const words = [...args];
    const personal = (words[0] || '').toLowerCase() === 'self';
    if (personal) words.shift();
    const action = (words[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(action)) return replay(message, this, args);

    const scope = personal ? 'user' : 'guild';
    const id = personal ? message.author.id : message.guild?.id;
    if (!id) return notice(message, '__Server aliases only work inside a server__');
    const title = personal ? 'Personal Aliases' : 'Server Aliases';

    if (personal && !(await isPremium('user', message.author.id))) {
      return notice(message, '__Personal aliases require an **active Premium subscription**__');
    }

    if (action === 'list') {
      const current = await aliases.list(scope, id);
      const lines = Object.entries(current)
        .sort(([x], [y]) => x.localeCompare(y))
        .map(([alias, command]) => `__\`${alias}\` → \`${command}\`__`);
      const count = personal ? `${lines.length}/${aliases.MAX_PERSONAL}` : String(lines.length);
      return card(message, { title: `${title} (${count})`, lines: [...(lines.length ? lines : ['__No aliases added yet__'])] });
    }

    if (!personal && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return notice(message, "__You don't have permission__");
    const [alias, command] = [words[1], words[2]];
    if (!alias || (action === 'add' && !command)) return replay(message, this, args);

    const key = `aliases:${scope}:${id}`;
    const wait = cooldown.peek(key, aliases.COOLDOWN_MS);
    if (wait.onCooldown) return notice(message, `__Please wait ${Math.ceil(wait.remainingMs / 1000)}s before changing the aliases again__`);

    const result = action === 'add' ? await aliases.add(scope, id, alias, command, client) : await aliases.remove(scope, id, alias);
    if (result.error) return notice(message, `__${result.error}__`);
    cooldown.start(key);
    const shown = alias.toLowerCase();
    return card(message, {
      title,
      lines: [action === 'add' ? `__\`${shown}\` now runs \`${result.command}\`__` : `__Removed \`${shown}\` (it ran \`${result.command}\`)__`],
    });
  },
};
