const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "support",
  aliases: [],
  description: "",
  usage: "",
  category: 'Information Commands',
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
                "content": "## <:early_supporter:1551750285586731123> Support Center\n\n*Need assistance? Choose a support option below or join [Support Server](<https://discord.gg/zk92wu2Vh>) to contact our development team!*"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- <:bughunter2:1551750291098042448> **Report Bugs & Errors** \n  » Select this option to report any issues or bugs you've encountered with the bot  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 10,
                "content": "- <:premiumbot:1551750296118497390> **Custom Bot Premium** \n  » Select this option to learn more about premium features or a custom bot  ⁘"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 3,
                    "custom_id": "support_menu",
                    "placeholder": "Choose a support option",
                    "min_values": 1,
                    "max_values": 1,
                    "options": [
                      {
                        "label": "・Bugs & Errors",
                        "value": "bugs",
                        "description": "» Report issues with the bot",
                        "emoji": {
                          "id": "1551750291098042448",
                          "name": "bughunter2",
                          "animated": false
                        }
                      },
                      {
                        "label": "・Custom Bot Premium",
                        "value": "premium",
                        "description": "» Inquire about premium features",
                        "emoji": {
                          "id": "1551750296118497390",
                          "name": "premiumbot",
                          "animated": false
                        }
                      }
                    ]
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
                "content": "-# __Use `&subscription <server|self>` to check status__  ⁘"
              }
            ],
            "spoiler": false
          }
        ],
        "v2": true,
        "attachments": [],
        "reply": false,
        "ping": false,
        "primary": true
      }
    ],
    "reactions": [],
    "flow": {
      "start": "s0",
      "states": {
        "s0": {
          "content": "",
          "embeds": [],
          "components": [
            {
              "type": 17,
              "accent_color": 13944790,
              "components": [
                {
                  "type": 10,
                  "content": "## <:early_supporter:1551750285586731123> Support Center\n\n*Need assistance? Choose a support option below or join [Support Server](<https://discord.gg/zk92wu2Vh>) to contact our development team!*"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 10,
                  "content": "- <:bughunter2:1551750291098042448> **Report Bugs & Errors** \n  » Select this option to report any issues or bugs you've encountered with the bot  ⁘"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 10,
                  "content": "- <:premiumbot:1551750296118497390> **Custom Bot Premium** \n  » Select this option to learn more about premium features or a custom bot  ⁘"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 1,
                  "components": [
                    {
                      "type": 3,
                      "custom_id": "support_menu",
                      "placeholder": "Choose a support option",
                      "min_values": 1,
                      "max_values": 1,
                      "options": [
                        {
                          "label": "・Bugs & Errors",
                          "value": "bugs",
                          "description": "» Report issues with the bot",
                          "emoji": {
                            "id": "1551750291098042448",
                            "name": "bughunter2",
                            "animated": false
                          }
                        },
                        {
                          "label": "・Custom Bot Premium",
                          "value": "premium",
                          "description": "» Inquire about premium features",
                          "emoji": {
                            "id": "1551750296118497390",
                            "name": "premiumbot",
                            "animated": false
                          }
                        }
                      ]
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
                  "content": "-# __Use `&subscription <server|self>` to check status__  ⁘"
                }
              ],
              "spoiler": false
            }
          ],
          "v2": true,
          "attachments": [],
          "reply": false,
          "ping": false
        }
      },
      "transitions": [
        {
          "from": "s0",
          "custom_id": "support_menu",
          "value": "bugs",
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "Report a Bug or Error",
            "custom_id": "bug_report_modal",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "issue_description",
                    "style": 2,
                    "label": "Description of the issue",
                    "placeholder": "Please describe the bug or error in detail",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "steps_to_reproduce",
                    "style": 2,
                    "label": "Steps to reproduce",
                    "placeholder": "List the steps to reproduce this issue",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "expected_behavior",
                    "style": 2,
                    "label": "Expected behavior",
                    "placeholder": "What did you expect to happen?",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              }
            ]
          }
        },
        {
          "from": "s0",
          "custom_id": "support_menu",
          "value": "premium",
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "Custom Bot Premium Inquiry",
            "custom_id": "premium_inquiry_modal",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "inquiry_description",
                    "style": 2,
                    "label": "What are you looking for?",
                    "placeholder": "Please describe what features or services you need",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "budget",
                    "style": 1,
                    "label": "Budget (if applicable)",
                    "placeholder": "What is your budget for this project?",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "timeline",
                    "style": 1,
                    "label": "Timeline/Deadline",
                    "placeholder": "When do you need this completed by?",
                    "min_length": 0,
                    "max_length": 4000,
                    "required": true
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  async execute(message, args) {
    await replay(message, this, args);
  },
};
