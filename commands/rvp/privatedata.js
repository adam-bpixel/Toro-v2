const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "privatedata",
  aliases: [],
  description: "",
  usage: "<show/hide>  ⁘",
  category: 'Rvp System',
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
                "content": "- __Control your data visibility__  ⁘"
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
                "content": "- __`&privatedata <show/hide>`__  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "## Current Status"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __Your data is currently **visible**__  ⁘"
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
        "sample": "test",
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
                    "content": "- __Select option use `show` or `hide`__  ⁘"
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
