const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "resetverificators",
  aliases: [],
  description: "",
  usage: "",
  category: 'Verification System',
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
                "content": "## Notice"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __Patience please... you can reset again <t:1790118053:R>, heehee__  ⁘"
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
