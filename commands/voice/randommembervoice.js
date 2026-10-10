const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "randommembervoice",
  aliases: ['rvc'],
  description: "",
  usage: "[channel ID]  ⁘",
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
                "content": "- __Get a random member from a voice channel__  ⁘"
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
                "content": "- __`&randommembervoice [channel ID]`__  ⁘"
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
