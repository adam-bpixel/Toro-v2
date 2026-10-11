const { replay } = require('../../utils/runtime/replay');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { card, notice } = require('../../utils/render/embeds');
const { serverAllowed } = require('../../models/economy/premium');
const { prefixesFor } = require('../../models/settings/prefix');
const { settingsOf, saveHub } = require('../../handlers/voice/tempvoice');


module.exports = {
  name: "tempvoice",
  aliases: [],
  description: 'Manage temporary voice channel system',
  usage: '[create|set <#voice>|off]',
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
                    "content": "### <:prmfree:1551750382206718012> Premium Command\nThis command requires an **active Premium subscription**.\n\n[View Premium plans](<https://discord.gg/zk92wu2Vh>) for more information."
                  },
                  {
                    "type": 10,
                    "content": "**Premium Features**\n<:point:1551750386967122050> Exclusive server protection tools.\n<:point:1551750386967122050> Advanced moderation commands.\n<:point:1551750386967122050> **tempvoice** » Manage temporary voice channel system\n<:point:1551750386967122050> Use `&subscription server` to check status."
                  }
                ],
                "accessory": {
                  "type": 11,
                  "media": {
                    "url": "{{botAvatar}}"
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
                "content": "-# <:point:1551750386967122050> Join our [Support Server](<https://discord.gg/zk92wu2Vh>) or <:getpremium:1551750391841165342> purchase Premium directly via Discord."
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
    if (!(await serverAllowed(message))) return replay(message, this, args);

    const { guild } = message;
    const first = (args[0] || '').toLowerCase();
    const settings = await settingsOf(guild.id);
    const hub = settings.hubId && guild.channels.cache.get(settings.hubId);

    if (!first || first === 'status') {
      const { server, personal } = await prefixesFor(guild.id, message.author.id);
      const p = personal || server;
      return card(message, {
        title: 'Temp Voice',
        lines: [
          `__Join channel__ : ${hub ? `<#${hub.id}>` : 'Not set'}`,
          `__Active rooms__ : ${(settings.channelIds || []).length}`,
          `__\`${p}tempvoice create\`__ : make the join channel`,
          `__\`${p}tempvoice set <#voice>\`__ : use an existing voice channel`,
          `__\`${p}tempvoice off\`__ : turn it off`,
        ],
      });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return notice(message, "__You don't have permission__");

    if (first === 'off') {
      if (!hub && !settings.hubId) return notice(message, '__Temp voice is already off__');
      await saveHub(guild.id, null);
      return card(message, { title: 'Temp Voice', lines: ['__Temp voice turned off - rooms already open are deleted when they empty__'] });
    }

    if (first === 'create') {
      const created = await guild.channels.create({ name: '➕ Create Room', type: ChannelType.GuildVoice, reason: 'Temp voice join channel' }).catch(() => null);
      if (!created) return notice(message, "__I couldn't create the channel - check my Manage Channels permission__");
      await saveHub(guild.id, created.id);
      return card(message, { title: 'Temp Voice', lines: [`__Join channel created__ : ${created}`, '__Joining it makes a room for the member__'] });
    }

    if (first === 'set') {
      const channel = message.mentions.channels.first() || guild.channels.cache.get((args[1] || '').replace(/[<#>]/g, ''));
      if (!channel || channel.type !== ChannelType.GuildVoice) return notice(message, '__Please pick a voice channel__');
      await saveHub(guild.id, channel.id);
      return card(message, { title: 'Temp Voice', lines: [`__Join channel set to__ ${channel}`] });
    }

    return notice(message, '__Use `create`, `set <#voice>` or `off`__');
  },
};
