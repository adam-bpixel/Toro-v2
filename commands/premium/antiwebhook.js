const { protectionCommand } = require('../../handlers/security/protection');

const recorded = {
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
                    "content": "**Premium Features**\n<:point:1551750386967122050> Exclusive server protection tools.\n<:point:1551750386967122050> Advanced moderation commands.\n<:point:1551750386967122050> **antiwebhook** » Enable or disable anti-webhook protection\n<:point:1551750386967122050> Use `&subscription server` to check status."
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
  };

module.exports = {
  ...protectionCommand({ name: 'antiwebhook', key: 'antiwebhook', label: 'Anti-webhook', summary: 'Enable or disable anti-webhook protection' }),
  recorded,
};
