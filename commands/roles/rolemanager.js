const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "rolemanager",
  aliases: [],
  description: "",
  usage: "add <ID|@member|username> <@role|roleID|rolename>",
  category: 'Roles Commands',
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
                "content": "## Role Manager"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- __`&rolemanager add <ID|@member|username> <@role|roleID|rolename>`__  ⁘\n- __`&rolemanager remove <ID|@member|username> [role]`__  ⁘\n- __`&rolemanager clear <ID|@member|username>`__  ⁘\n- __`&rolemanager list [user]`__  ⁘"
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
