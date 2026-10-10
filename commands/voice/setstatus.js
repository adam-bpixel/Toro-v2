const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "setstatus",
  aliases: [],
  description: "",
  usage: "<status>  ⁘",
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
                "content": "- __Set voice channel status__  ⁘"
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
                "content": "- __`&setstatus <status>`__  ⁘"
              },
              {
                "type": 10,
                "content": "- __`&setstatus <channelid> <status>`__  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __Max 500 characters__  ⁘"
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
    "reactions": []
  },
  async execute(message, args) {
    await replay(message, this, args);
  },
};
