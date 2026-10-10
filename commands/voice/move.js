const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "move",
  aliases: ['vcmove', 'movevoice'],
  description: "",
  usage: "<ID|@member|username> [channel ID]  ⁘",
  category: 'Voice Commands',
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
                "content": "- __Move a member to another voice channel__  ⁘"
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
                "content": "- __`&move <ID|@member|username> [channel ID]`__  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __Cooldown: 10 seconds__  ⁘"
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
    "reactions": [],
    "variants": [
      {
        "args": 1,
        "sample": "{{mention}}",
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
                    "content": "## Notice"
                  },
                  {
                    "type": 14,
                    "spacing": 1,
                    "divider": true
                  },
                  {
                    "type": 10,
                    "content": "- __You must be in a voice channel__  ⁘"
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
        "reactions": [],
        "flow": null,
        "kind": "ok"
      }
    ]
  },
  async execute(message, args) {
    await replay(message, this, args);
  },
};
