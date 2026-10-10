const { PermissionFlagsBits } = require('discord.js');
const { replay } = require('../../utils/runtime/replay');
const { card, notice } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

const CUSTOM = /^<(a?):(\w+):(\d+)>$/;
const customUrl = (animated, id) => `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=128`;

module.exports = {
  name: "emoji",
  aliases: [],
  description: "",
  usage: "add <name> <emoji|URL|attachment>  ⁘",
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
                "content": "- __Manage server emojis__  ⁘"
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
                "content": "- __`&emoji add <name> <emoji|URL|attachment>`__  ⁘\n- __`&emoji remove <emoji|name>`__  ⁘\n- __`&emoji list`__  ⁘"
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
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(sub)) return replay(message, this, args);
    if (!message.guild) return;

    if (sub === 'list') {
      const emojis = [...message.guild.emojis.cache.values()];
      if (!emojis.length) return card(message, { title: 'Server Emojis', lines: ['__No emojis in this server__'] });
      let text = '';
      let shown = 0;
      for (const e of emojis) {
        const next = `${e} `;
        if (text.length + next.length > 3500) break;
        text += next;
        shown++;
      }
      const more = shown < emojis.length ? ` (+${emojis.length - shown} more)` : '';
      return card(message, { title: `Server Emojis (${emojis.length})`, lines: [text + more] });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
      return notice(message, "__You don't have permission__");
    }

    if (sub === 'remove') {
      const query = args.slice(1).join(' ').trim();
      if (!query) return replay(message, this, []);
      const id = (query.match(CUSTOM) || [])[3] || (/^\d{15,25}$/.test(query) ? query : null);
      const emoji = id
        ? message.guild.emojis.cache.get(id)
        : message.guild.emojis.cache.find((e) => e.name.toLowerCase() === query.toLowerCase());
      if (!emoji) return notice(message, "__Couldn't find that emoji in this server__");
      const name = emoji.name;
      const done = await emoji.delete(`Removed by ${message.author.username}`).then(() => true).catch(() => false);
      if (!done) return notice(message, "__Couldn't remove that emoji (check my permissions)__");
      return card(message, { title: `${EMOJI.success} Emoji`, lines: [`__Removed__ \`${name}\``] });
    }

    const name = args[1];
    if (!name) return replay(message, this, []);
    if (!/^\w{2,32}$/.test(name)) return notice(message, '__The name must be 2-32 letters, numbers or underscores__');

    const source = args[2] || '';
    const attachment = message.attachments && message.attachments.first();
    const custom = source.match(CUSTOM);
    let url = attachment ? attachment.url : custom ? customUrl(custom[1], custom[3]) : /^https?:\/\//i.test(source) ? source : null;
    if (!url) return notice(message, '__Give a custom emoji, an image URL or attach an image__');

    const created = await message.guild.emojis.create({ attachment: url, name, reason: `Added by ${message.author.username}` }).catch((error) => error);
    if (created instanceof Error) {
      const full = created.code === 30008;
      return notice(message, full ? '__This server has no free emoji slots__' : "__Couldn't add that emoji (image must be PNG/JPG/GIF under 256 KB)__");
    }
    return card(message, { title: `${EMOJI.success} Emoji`, lines: [`__Added__ ${created} \`${created.name}\``] });
  },
};
