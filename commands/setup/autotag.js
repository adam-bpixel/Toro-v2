const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "autotag",
  aliases: ['auto-tag', 'namestag'],
  description: "",
  usage: "add <@role|roleID|rolename> <tag>  ⁘",
  category: 'Setup Commands',
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
                "content": "- __Configure auto-tag settings__  ⁘"
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
                "content": "- __`&autotag add <@role|roleID|rolename> <tag>`__  ⁘"
              },
              {
                "type": 10,
                "content": "- __`&autotag remove <@role|roleID|rolename|number>`__  ⁘"
              },
              {
                "type": 10,
                "content": "- __`&autotag list`__  ⁘"
              },
              {
                "type": 10,
                "content": "- __`&autotag clear`__  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __Tag max 10 characters__  ⁘"
              },
              {
                "type": 10,
                "content": "- __Cooldown: 30 seconds__  ⁘"
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
