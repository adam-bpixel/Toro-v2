const { replay } = require('../../utils/runtime/replay');
const { PermissionFlagsBits, Routes } = require('discord.js');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { serverAllowed } = require('../../models/economy/premium');
const cooldown = require('../../utils/runtime/cooldown');
const { FONT_IDS, EFFECT_IDS, sendHelp } = require('../../utils/render/nameStyles');

const COOLDOWN_MS = 400_000;

const FIELDS = { name: 'nick', avatar: 'avatar', banner: 'banner', bio: 'bio', style: null };

const FONTS = FONT_IDS;
const EFFECTS = EFFECT_IDS;
const FIELD_USAGE = {
  name: { summary: "Change the bot's nickname in this server", usage: '&guildprofile name <name|reset>', notes: ['__Up to 32 characters__'] },
  avatar: { summary: "Change the bot's avatar in this server", usage: '&guildprofile avatar <image link|reset>', notes: ['__Or attach an image__', '__PNG, JPG, GIF or WebP, up to 8 MB__'] },
  banner: { summary: "Change the bot's banner in this server", usage: '&guildprofile banner <image link|reset>', notes: ['__Or attach an image__', '__PNG, JPG, GIF or WebP, up to 8 MB__'] },
  bio: { summary: "Change the bot's about-me text in this server", usage: '&guildprofile bio <text|reset>', notes: ['__Up to 190 characters__'] },
  style: {
    summary: "Change the color, font and effect of the bot's name",
    usage: '&guildprofile style <color> [color2] [font] [effect]',
    notes: ['`&guildprofile style ff00ff 10 3` : color, font number, effect number (the # is optional)', '`&guildprofile style reset` : back to the default', '`&guildprofile style help` : every font and effect'],
  },
};
const STYLE_USAGE = '&guildprofile style <color> [color2] [font] [effect]';

function parseStyle(tokens) {
  const colors = [];
  let fontId = null;
  let effectId = null;
  for (const raw of tokens) {
    const token = raw.toLowerCase();
    const [key, value] = token.includes(':') ? token.split(':') : [null, token];
    if (/^#?[0-9a-f]{6}$/.test(token)) colors.push(parseInt(token.replace('#', ''), 16));
    else if (key === 'font' && (FONTS[value] || /^\d+$/.test(value))) fontId = FONTS[value] || Number(value);
    else if (key === 'effect' && (EFFECTS[value] || /^\d+$/.test(value))) effectId = EFFECTS[value] || Number(value);
    else if (!key && /^\d{1,2}$/.test(token)) {
      if (fontId === null) fontId = Number(token);
      else if (effectId === null) effectId = Number(token);
      else return { error: `I don't understand "${raw}"` };
    }
    else if (!key && EFFECTS[token]) effectId = EFFECTS[token];
    else if (!key && FONTS[token]) fontId = FONTS[token];
    else return { error: `I don't understand "${raw}"` };
  }
  if (!colors.length || colors.length > 2) return { error: 'Give one or two hex colors, like #ff00ff' };
  if (fontId === null) fontId = 11;
  if (effectId === null) effectId = colors.length === 2 ? 2 : 1;
  if (fontId < 1 || fontId > 12) return { error: 'The font must be between 1 and 12' };
  if (effectId < 1 || effectId > 6) return { error: 'The effect must be between 1 and 6' };
  if (effectId === 2 && colors.length < 2) return { error: 'The gradient effect needs two colors' };
  return { fontId, effectId, colors };
}
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

async function toDataUri(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const type = response?.headers.get('content-type')?.split(';')[0];
  if (!response?.ok || !IMAGE_TYPES.includes(type)) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.length > 8 * 1024 * 1024 ? null : `data:${type};base64,${buffer.toString('base64')}`;
}


module.exports = {
  name: "guildprofile",
  aliases: ['gp', 'gb'],
  description: 'Custom App profile avatar, banner, name, bio',
  usage: '<name|avatar|banner|bio|style> <value|reset>',
  category: 'Premium Commands',
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
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "### <:prmfree:1551750382206718012> Premium Command\nThis command requires an **active Premium subscription**.\n\n[View Premium plans](<https://discord.gg/EVJNa3SRD7>) for more information."
                  },
                  {
                    "type": 10,
                    "content": "**Premium Features**\n<:point:1551750386967122050> Exclusive server protection tools.\n<:point:1551750386967122050> Advanced moderation commands.\n<:point:1551750386967122050> **guildprofile** » Custom App profile avatar, banner, name, bio\n<:point:1551750386967122050> Use `&subscription server` to check status."
                  }
                ],
                "accessory": {
                  "type": 11,
                  "media": {
                    "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556482669412392/a_2505bb24455553dc2f6ef43ffee02137.gif?ex=6ab9adb9&is=6ab85c39&hm=7a9b092ad55da4c5e0dcb43ecc6c00b72819ac50fa0f5a7a9a5bf1aa8ae1e9bc&"
                  },
                  "description": null,
                  "spoiler": false
                }
              },
              {
                "type": 12,
                "items": [
                  {
                    "media": {
                      "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&"
                    },
                    "description": null,
                    "spoiler": false
                  }
                ]
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "-# <:point:1551750386967122050> Join our [Support Server](<https://discord.gg/EVJNa3SRD7>) or <:getpremium:1551750391841165342> purchase Premium directly via Discord."
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 2,
                    "style": 6,
                    "sku_id": "1523752469136670863"
                  }
                ]
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
    if ((args[0] || '').toLowerCase() === 'style' && ['help', 'list'].includes((args[1] || '').toLowerCase())) return sendHelp(message);

    if (!(await serverAllowed(message))) return replay(message, this, args);

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return notice(message, "__You don't have permission__");

    const field = (args[0] || '').toLowerCase();
    if (!Object.hasOwn(FIELDS, field)) {
      return usageCard(message, {
        summary: "Customize the bot's profile in this server",
        usage: '&guildprofile <name|avatar|banner|bio|style> <value|reset>',
        notes: ['`name` : the bot nickname', '`avatar` : an image link or attached image', '`banner` : an image link or attached image', '`bio` : the about-me text', '`reset` : back to the default', '__Cooldown: 400 seconds__'],
      });
    }
    if (args.length < 2 && !message.attachments.size) {
      const help = FIELD_USAGE[field];
      return usageCard(message, { summary: help.summary, usage: help.usage, notes: help.notes });
    }

    const key = `guildprofile:${message.guild.id}`;
    const wait = cooldown.peek(key, COOLDOWN_MS);
    if (wait.onCooldown) {
      const seconds = Math.ceil(wait.remainingMs / 1000);
      return notice(message, `__Please wait ${seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`} before changing the profile again__`);
    }

    message.channel.sendTyping().catch(() => {});

    const rest = args.slice(1).join(' ').trim();
    const attachment = message.attachments.first()?.url;
    const reset = rest.toLowerCase() === 'reset';
    if (field === 'style') {
      if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
        return notice(message, '__I need the **Change Nickname** permission to change my name style__');
      }
      let body;
      let summary;
      if (reset) {
        body = { display_name_font_id: null, display_name_effect_id: null, display_name_colors: null };
        summary = '__The style was reset__';
      } else {
        const parsed = parseStyle(args.slice(1));
        if (parsed.error) {
          return usageCard(message, {
            summary: parsed.error,
            usage: STYLE_USAGE,
            notes: ['Use `&guildprofile style help` to see every font and effect'],
          });
        }
        body = { display_name_font_id: parsed.fontId, display_name_effect_id: parsed.effectId, display_name_colors: parsed.colors };
        const shown = parsed.colors.map((c) => `\`#${c.toString(16).padStart(6, '0')}\``).join(' → ');
        summary = `__The style was updated__ : ${shown}`;
      }
      try {
        await message.client.rest.patch(Routes.guildMember(message.guild.id, '@me'), { body });
      } catch (error) {
        return notice(message, `__Discord refused it__ : ${error.rawError?.message || error.message}`);
      }
      cooldown.start(key);
      return card(message, { title: 'Guild Profile', lines: [summary] });
    }

    let value;
    if (reset) value = null;
    else if (field === 'avatar' || field === 'banner') {
      const source = attachment || rest;
      if (!source) return notice(message, `__Give an image link, attach an image, or use \`reset\`__`);
      value = await toDataUri(source);
      if (!value) return notice(message, '__That is not a valid image (PNG, JPG, GIF or WebP, up to 8 MB)__');
    } else {
      if (!rest) return notice(message, `__Give the new ${field} or use \`reset\`__`);
      if (rest.length > (field === 'name' ? 32 : 190)) return notice(message, `__The ${field} is too long (max ${field === 'name' ? 32 : 190} characters)__`);
      value = rest;
    }

    try {
      await message.client.rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { [FIELDS[field]]: value } });
    } catch (error) {
      return notice(message, `__Discord refused it__ : ${error.rawError?.message || error.message}`);
    }
    cooldown.start(key);
    return card(message, { title: 'Guild Profile', lines: [reset ? `__The ${field} was reset__` : `__The ${field} was updated__`] });
  },
};
