const { replay } = require('../../utils/runtime/replay');

module.exports = {
  name: "setup",
  aliases: [],
  description: "",
  usage: "",
  category: 'Setup Commands',
  idleDisableMs: 5 * 60 * 1000,
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
                "type": 12,
                "items": [
                  {
                    "media": {
                      "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553559033422544916/ezgif-7330ede79c09b445.gif?ex=6ab9b019&is=6ab85e99&hm=de5e907c79527e2fb4c1a2c4ccb5f1c61d5966fa789e328177fe46f837563e13&"
                    },
                    "description": "{{displayName}}'s server Server Setup",
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
                "content": "## Server Setup • Page 1/3"
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "- <:4151dropdownmenu:1551750312304443395> __Configure automatic role assignment for new members__  ⁘"
                  }
                ],
                "accessory": {
                  "type": 2,
                  "custom_id": "setup_autorole_1398395532103254157",
                  "style": 2,
                  "label": "Auto Role"
                }
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "- <:4151dropdownmenu:1551750312304443395> __Configure automatic nickname tags based on roles__  ⁘"
                  }
                ],
                "accessory": {
                  "type": 2,
                  "custom_id": "setup_autotag_1398395532103254157",
                  "style": 2,
                  "label": "Auto Tag"
                }
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "- <:4151dropdownmenu:1551750312304443395> __Configure staff application system__  ⁘"
                  }
                ],
                "accessory": {
                  "type": 2,
                  "custom_id": "setup_staffapply_1398395532103254157",
                  "style": 2,
                  "label": "Staff Apply"
                }
              },
              {
                "type": 14,
                "spacing": 1,
                "divider": true
              },
              {
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "- <:4151dropdownmenu:1551750312304443395> __Configure server logging system__  ⁘"
                  }
                ],
                "accessory": {
                  "type": 2,
                  "custom_id": "setup_logs_button_1398395532103254157",
                  "style": 2,
                  "label": "Logs Server"
                }
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
                    "type": 2,
                    "custom_id": "setup_page_1398395532103254157_0",
                    "style": 2,
                    "disabled": true,
                    "emoji": {
                      "id": "1551750276745003040",
                      "name": "left",
                      "animated": true
                    }
                  },
                  {
                    "type": 2,
                    "custom_id": "setup_page_1398395532103254157_2",
                    "style": 2,
                    "emoji": {
                      "id": "1551750281555873882",
                      "name": "right",
                      "animated": true
                    }
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
        "ping": true,
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
                  "type": 12,
                  "items": [
                    {
                      "media": {
                        "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553559033422544916/ezgif-7330ede79c09b445.gif?ex=6ab9b019&is=6ab85e99&hm=de5e907c79527e2fb4c1a2c4ccb5f1c61d5966fa789e328177fe46f837563e13&"
                      },
                      "description": "{{displayName}}'s server Server Setup",
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
                  "content": "## Server Setup • Page 1/3"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure automatic role assignment for new members__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_autorole_1398395532103254157",
                    "style": 2,
                    "label": "Auto Role"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure automatic nickname tags based on roles__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_autotag_1398395532103254157",
                    "style": 2,
                    "label": "Auto Tag"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure staff application system__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_staffapply_1398395532103254157",
                    "style": 2,
                    "label": "Staff Apply"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure server logging system__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_logs_button_1398395532103254157",
                    "style": 2,
                    "label": "Logs Server"
                  }
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
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_0",
                      "style": 2,
                      "disabled": true,
                      "emoji": {
                        "id": "1551750276745003040",
                        "name": "left",
                        "animated": true
                      }
                    },
                    {
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_2",
                      "style": 2,
                      "emoji": {
                        "id": "1551750281555873882",
                        "name": "right",
                        "animated": true
                      }
                    }
                  ]
                }
              ],
              "spoiler": false
            }
          ],
          "v2": true,
          "attachments": [],
          "reply": false,
          "ping": true
        },
        "s1": {
          "content": "",
          "embeds": [],
          "components": [
            {
              "type": 17,
              "accent_color": 13944790,
              "components": [
                {
                  "type": 12,
                  "items": [
                    {
                      "media": {
                        "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553559033422544916/ezgif-7330ede79c09b445.gif?ex=6ab9b019&is=6ab85e99&hm=de5e907c79527e2fb4c1a2c4ccb5f1c61d5966fa789e328177fe46f837563e13&"
                      },
                      "description": "{{displayName}}'s server Server Setup",
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
                  "content": "## Server Setup • Page 2/3"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure muter roles for voice moderation__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_muter_1398395532103254157",
                    "style": 2,
                    "label": "Muter"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure role request system channels__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_rolerequest_1398395532103254157",
                    "style": 2,
                    "label": "RoleRequest"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure level roles XP reward system__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_levelroles_1398395532103254157",
                    "style": 2,
                    "label": "Level Roles"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure jailer roles for jail moderation__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_jailer_1398395532103254157",
                    "style": 2,
                    "label": "Jailer"
                  }
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
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_1",
                      "style": 2,
                      "emoji": {
                        "id": "1551750276745003040",
                        "name": "left",
                        "animated": true
                      }
                    },
                    {
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_3",
                      "style": 2,
                      "emoji": {
                        "id": "1551750281555873882",
                        "name": "right",
                        "animated": true
                      }
                    }
                  ]
                }
              ],
              "spoiler": false
            }
          ],
          "v2": true,
          "attachments": [],
          "reply": false,
          "ping": false
        },
        "s2": {
          "content": "",
          "embeds": [],
          "components": [
            {
              "type": 17,
              "accent_color": 13944790,
              "components": [
                {
                  "type": 12,
                  "items": [
                    {
                      "media": {
                        "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553559033422544916/ezgif-7330ede79c09b445.gif?ex=6ab9b019&is=6ab85e99&hm=de5e907c79527e2fb4c1a2c4ccb5f1c61d5966fa789e328177fe46f837563e13&"
                      },
                      "description": "{{displayName}}'s server Server Setup",
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
                  "content": "## Server Setup • Page 1/3"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure automatic role assignment for new members__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_autorole_1398395532103254157",
                    "style": 2,
                    "label": "Auto Role"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure automatic nickname tags based on roles__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_autotag_1398395532103254157",
                    "style": 2,
                    "label": "Auto Tag"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure staff application system__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_staffapply_1398395532103254157",
                    "style": 2,
                    "label": "Staff Apply"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure server logging system__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_logs_button_1398395532103254157",
                    "style": 2,
                    "label": "Logs Server"
                  }
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
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_0",
                      "style": 2,
                      "disabled": true,
                      "emoji": {
                        "id": "1551750276745003040",
                        "name": "left",
                        "animated": true
                      }
                    },
                    {
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_2",
                      "style": 2,
                      "emoji": {
                        "id": "1551750281555873882",
                        "name": "right",
                        "animated": true
                      }
                    }
                  ]
                }
              ],
              "spoiler": false
            }
          ],
          "v2": true,
          "attachments": [],
          "reply": false,
          "ping": false
        },
        "s3": {
          "content": "",
          "embeds": [],
          "components": [
            {
              "type": 17,
              "accent_color": 13944790,
              "components": [
                {
                  "type": 12,
                  "items": [
                    {
                      "media": {
                        "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553559033422544916/ezgif-7330ede79c09b445.gif?ex=6ab9b019&is=6ab85e99&hm=de5e907c79527e2fb4c1a2c4ccb5f1c61d5966fa789e328177fe46f837563e13&"
                      },
                      "description": "{{displayName}}'s server Server Setup",
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
                  "content": "## Server Setup • Page 3/3"
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure ticket support system__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_ticket_1398395532103254157",
                    "style": 2,
                    "label": "Ticket"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure verificator roles for member verification__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_verificator_1398395532103254157",
                    "style": 2,
                    "label": "Verificator"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure command aliases for custom shortcuts__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_aliases_1398395532103254157",
                    "style": 2,
                    "label": "Aliases"
                  }
                },
                {
                  "type": 14,
                  "spacing": 1,
                  "divider": true
                },
                {
                  "type": 9,
                  "components": [
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure channels to bypass clear command__  ⁘"
                    }
                  ],
                  "accessory": {
                    "type": 2,
                    "custom_id": "setup_clearsetup_1398395532103254157",
                    "style": 2,
                    "label": "Clear Setup"
                  }
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
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_2",
                      "style": 2,
                      "emoji": {
                        "id": "1551750276745003040",
                        "name": "left",
                        "animated": true
                      }
                    },
                    {
                      "type": 2,
                      "custom_id": "setup_page_1398395532103254157_4",
                      "style": 2,
                      "emoji": {
                        "id": "1551750281555873882",
                        "name": "right",
                        "animated": true
                      }
                    }
                  ]
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
          "custom_id": "setup_autorole_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Auto Role"
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
                      "content": "## <:param:1551750316867850291> Auto Role"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure Auto Role settings. Use the buttons below to add or remove roles (max 3).__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Autoroles 0/3 :__  ⁘\n- __No autoroles configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Auto Role Add",
                          "custom_id": "setup_add_autorole_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Auto Role Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_autorole_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s0",
          "custom_id": "setup_autotag_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Auto Tag"
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
                      "content": "## <:param:1551750316867850291> Auto Tag"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure Auto Tag settings. Use the buttons below to add or remove tags (max 5).__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Autotags 0/5 :__  ⁘\n- __No autotags configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Auto Tag Add",
                          "custom_id": "setup_add_autotag_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Auto Tag Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_autotag_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s0",
          "custom_id": "setup_staffapply_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "Staff Application Setup",
            "custom_id": "staffapply_setup_1398395532103254157_h",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              }
            ]
          }
        },
        {
          "from": "s0",
          "custom_id": "setup_logs_button_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Logs Server"
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
                      "content": "## <:param:1551750316867850291> Logs Server Setup"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Select type to create event__  ⁘"
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
                          "placeholder": "Select log event category",
                          "options": [
                            {
                              "value": "role_events",
                              "label": "Role Events",
                              "emoji": {
                                "name": "link",
                                "id": "1551750321330589696",
                                "animated": false
                              },
                              "description": "Role Created, Role Deleted, Role Updated"
                            },
                            {
                              "value": "member_events",
                              "label": "Member Events",
                              "emoji": {
                                "name": "members",
                                "id": "1551750325835268146",
                                "animated": false
                              },
                              "description": "Member Kicked, Banned, Roles, etc."
                            },
                            {
                              "value": "channel_events",
                              "label": "Channel Events",
                              "emoji": {
                                "name": "channels",
                                "id": "1551750330595811338",
                                "animated": false
                              },
                              "description": "Channel Created, Channel Deleted, etc."
                            },
                            {
                              "value": "message_events",
                              "label": "Message Events",
                              "emoji": {
                                "name": "2885discordmessagerequestswhite",
                                "id": "1551750335066804275",
                                "animated": false
                              },
                              "description": "Message Deleted, Bulk Delete, etc."
                            },
                            {
                              "value": "webhook_events",
                              "label": "Webhook Events",
                              "emoji": {
                                "name": "7970integrationswebhooks1",
                                "id": "1551750339403980860",
                                "animated": false
                              },
                              "description": "Webhook Created, Webhook Updated, etc."
                            },
                            {
                              "value": "integration_events",
                              "label": "Integration Events",
                              "emoji": {
                                "name": "8067integrationschannelsfollowed",
                                "id": "1551750346714386453",
                                "animated": false
                              },
                              "description": "Integration Created, Integration Deleted"
                            },
                            {
                              "value": "invite_events",
                              "label": "Invite Events",
                              "emoji": {
                                "name": "9437invite",
                                "id": "1551750351017873490",
                                "animated": false
                              },
                              "description": "Invite Created, Invite Deleted"
                            },
                            {
                              "value": "voice_events",
                              "label": "Voice Events",
                              "emoji": {
                                "name": "voicee",
                                "id": "1551750355497386036",
                                "animated": false
                              },
                              "description": "Voice Joined, Voice Left, etc."
                            },
                            {
                              "value": "thread_events",
                              "label": "Thread Events",
                              "emoji": {
                                "name": "thread",
                                "id": "1551750360014524528",
                                "animated": false
                              },
                              "description": "Thread Created, Thread Updated, etc."
                            },
                            {
                              "value": "server_events",
                              "label": "Server Events",
                              "emoji": {
                                "name": "6849serverguide",
                                "id": "1551750364418543636",
                                "animated": false
                              },
                              "description": "Server Updated, Event Created/Updated/Deleted"
                            },
                            {
                              "value": "emoji_sticker_events",
                              "label": "Stickers & Emoji Events",
                              "emoji": {
                                "name": "sticker",
                                "id": "1551750368906448946",
                                "animated": false
                              },
                              "description": "Sticker & Emoji Created, Deleted, etc."
                            },
                            {
                              "value": "automod_events",
                              "label": "AutoMod Events",
                              "emoji": {
                                "name": "1376logautomodplusd",
                                "id": "1551750373369315418",
                                "animated": false
                              },
                              "description": "Rule Created, Block Message, etc."
                            },
                            {
                              "value": "soundboard_events",
                              "label": "Soundboard Events",
                              "emoji": {
                                "name": "voicee",
                                "id": "1551750355497386036",
                                "animated": false
                              },
                              "description": "Soundboard Created, Updated, Deleted"
                            }
                          ],
                          "min_values": 1,
                          "max_values": 1,
                          "custom_id": "setup_logs_select_category_1398395532103254157"
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
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Select type to show config__  ⁘"
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
                          "placeholder": "Select log category to show config",
                          "options": [
                            {
                              "value": "role_events",
                              "label": "Role Events",
                              "emoji": {
                                "name": "link",
                                "id": "1551750321330589696",
                                "animated": false
                              },
                              "description": "View all role event logs"
                            },
                            {
                              "value": "member_events",
                              "label": "Member Events",
                              "emoji": {
                                "name": "members",
                                "id": "1551750325835268146",
                                "animated": false
                              },
                              "description": "View all member event logs"
                            },
                            {
                              "value": "channel_events",
                              "label": "Channel Events",
                              "emoji": {
                                "name": "channels",
                                "id": "1551750330595811338",
                                "animated": false
                              },
                              "description": "View all channel event logs"
                            },
                            {
                              "value": "message_events",
                              "label": "Message Events",
                              "emoji": {
                                "name": "2885discordmessagerequestswhite",
                                "id": "1551750335066804275",
                                "animated": false
                              },
                              "description": "View all message event logs"
                            },
                            {
                              "value": "webhook_events",
                              "label": "Webhook Events",
                              "emoji": {
                                "name": "7970integrationswebhooks1",
                                "id": "1551750339403980860",
                                "animated": false
                              },
                              "description": "View all webhook event logs"
                            },
                            {
                              "value": "integration_events",
                              "label": "Integration Events",
                              "emoji": {
                                "name": "8067integrationschannelsfollowed",
                                "id": "1551750346714386453",
                                "animated": false
                              },
                              "description": "View all integration event logs"
                            },
                            {
                              "value": "invite_events",
                              "label": "Invite Events",
                              "emoji": {
                                "name": "9437invite",
                                "id": "1551750351017873490",
                                "animated": false
                              },
                              "description": "View all invite event logs"
                            },
                            {
                              "value": "voice_events",
                              "label": "Voice Events",
                              "emoji": {
                                "name": "voicee",
                                "id": "1551750355497386036",
                                "animated": false
                              },
                              "description": "View all voice event logs"
                            },
                            {
                              "value": "thread_events",
                              "label": "Thread Events",
                              "emoji": {
                                "name": "thread",
                                "id": "1551750360014524528",
                                "animated": false
                              },
                              "description": "View all thread event logs"
                            },
                            {
                              "value": "server_events",
                              "label": "Server Events",
                              "emoji": {
                                "name": "6849serverguide",
                                "id": "1551750364418543636",
                                "animated": false
                              },
                              "description": "View all server event logs"
                            },
                            {
                              "value": "emoji_sticker_events",
                              "label": "Stickers & Emoji Events",
                              "emoji": {
                                "name": "sticker",
                                "id": "1551750368906448946",
                                "animated": false
                              },
                              "description": "View all sticker & emoji logs"
                            },
                            {
                              "value": "automod_events",
                              "label": "AutoMod Events",
                              "emoji": {
                                "name": "1376logautomodplusd",
                                "id": "1551750373369315418",
                                "animated": false
                              },
                              "description": "View all automod event logs"
                            },
                            {
                              "value": "soundboard_events",
                              "label": "Soundboard Events",
                              "emoji": {
                                "name": "voicee",
                                "id": "1551750355497386036",
                                "animated": false
                              },
                              "description": "View all soundboard event logs"
                            }
                          ],
                          "min_values": 1,
                          "max_values": 1,
                          "custom_id": "setup_logs_view_config_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s0",
          "custom_id": "setup_page_1398395532103254157_2",
          "value": null,
          "global": false,
          "kind": "update",
          "to": "s1",
          "reply": null,
          "action": false,
          "modal": null
        },
        {
          "from": "s1",
          "custom_id": "setup_muter_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Muter"
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
                      "content": "## <:param:1551750316867850291> Muter"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure Muter settings. Use the buttons below to add or remove roles (max 7).__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Muter Roles 0/7 :__  ⁘\n- __No muter roles configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Muter Add",
                          "custom_id": "setup_add_muter_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Muter Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_muter_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s1",
          "custom_id": "setup_rolerequest_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "RoleRequest System Setup",
            "custom_id": "toroset_1398395532103254157_h",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "",
                    "style": 1,
                    "label": "",
                    "placeholder": "",
                    "min_length": null,
                    "max_length": null,
                    "required": true
                  }
                ]
              }
            ]
          }
        },
        {
          "from": "s1",
          "custom_id": "setup_levelroles_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Level Roles"
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
                      "content": "## <:param:1551750316867850291> Level Roles"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure Level Roles. Assign roles when members reach specific levels (max 25).__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Level Roles 0/25 :__  ⁘\n- __No level roles configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Level Role Add",
                          "custom_id": "setup_add_levelroles_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Level Role Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_levelroles_1398395532103254157"
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
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Bypass Roles (users with these roles won't receive level roles) :__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Bypass Roles 0/10 :__  ⁘\n- __No bypass roles configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Bypass Add",
                          "custom_id": "setup_add_bypass_levelroles_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Bypass Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_bypass_levelroles_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s1",
          "custom_id": "setup_jailer_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Jailer"
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
                      "content": "## <:param:1551750316867850291> Jailer"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure Jailer settings. Use the buttons below to add or remove roles (max 7).__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Jailer Roles 0/7 :__  ⁘\n- __No jailer roles configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Jailer Add",
                          "custom_id": "setup_add_jailer_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Jailer Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_jailer_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s1",
          "custom_id": "setup_page_1398395532103254157_1",
          "value": null,
          "global": false,
          "kind": "update",
          "to": "s2",
          "reply": null,
          "action": false,
          "modal": null
        },
        {
          "from": "s2",
          "custom_id": "setup_page_1398395532103254157_2",
          "value": null,
          "global": false,
          "kind": "update",
          "to": "s1",
          "reply": null,
          "action": false,
          "modal": null
        },
        {
          "from": "s1",
          "custom_id": "setup_page_1398395532103254157_3",
          "value": null,
          "global": false,
          "kind": "update",
          "to": "s3",
          "reply": null,
          "action": false,
          "modal": null
        },
        {
          "from": "s3",
          "custom_id": "setup_ticket_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "modal",
          "to": null,
          "reply": null,
          "action": false,
          "modal": {
            "title": "Ticket System Setup",
            "custom_id": "ticset_1398395532103254157_h",
            "components": [
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "ticket_category",
                    "style": 1,
                    "label": "Ticket Category ID",
                    "placeholder": "Category where new ticket channels are created",
                    "min_length": null,
                    "max_length": 25,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "ticket_log_channel",
                    "style": 1,
                    "label": "Log Channel ID",
                    "placeholder": "Where ticket open/close logs are sent",
                    "min_length": null,
                    "max_length": 25,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "ticket_panel_channel",
                    "style": 1,
                    "label": "Panel Channel ID",
                    "placeholder": "Where the \"open a ticket\" panel is posted",
                    "min_length": null,
                    "max_length": 25,
                    "required": true
                  }
                ]
              },
              {
                "type": 1,
                "components": [
                  {
                    "type": 4,
                    "custom_id": "ticket_panel_style",
                    "style": 1,
                    "label": "Panel Style (button or menu)",
                    "placeholder": "button or menu",
                    "min_length": null,
                    "max_length": 10,
                    "required": true
                  }
                ]
              }
            ]
          }
        },
        {
          "from": "s3",
          "custom_id": "setup_verificator_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Verificator"
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
                      "content": "## <:param:1551750316867850291> Verificator"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure Verificator settings. Use the buttons below to add or remove roles (max 7).__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Verificator Roles 0/7 :__  ⁘\n- __No verificator roles configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Verificator Add",
                          "custom_id": "setup_add_verificator_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Verificator Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_verificator_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s3",
          "custom_id": "setup_aliases_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Aliases"
                        }
                      ]
                    },
                    {
                      "type": 10,
                      "content": "## <:param:1551750316867850291> Aliases"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure command aliases. Use the buttons below to add or remove aliases__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Aliases 67/50 :__  ⁘\n- __`transferleader` → `switchleader`__  ⁘\n- __`addclan` → `adduser`__  ⁘\n- __`remove` → `removeuser`__  ⁘\n- __`clan-manager` → `clanmanager`__  ⁘\n- __`cmd` → `command`__  ⁘\n- __`p` → `profile`__  ⁘\n- __`prof` → `profile`__  ⁘\n- __`r` → `rank`__  ⁘\n- __`v` → `toro`__  ⁘\n- __`vp` → `toro`__  ⁘\n- __`u` → `userinfo`__  ⁘\n- __`ui` → `userinfo`__  ⁘\n- __`who` → `userinfo`__  ⁘\n- __`useravatar` → `avatar`__  ⁘\n- __`pfp` → `avatar`__  ⁘\n- __`a` → `avatar`__  ⁘\n- __`profilepicture` → `avatar`__  ⁘\n- __`userbanner` → `banner`__  ⁘\n- __`ub` → `banner`__  ⁘\n- __`b` → `banner`__  ⁘\n- __`purge` → `clear`__  ⁘\n- __`ms7` → `clear`__  ⁘\n- __`clean` → `clear`__  ⁘\n- __`vcmove` → `move`__  ⁘\n- __`movevoice` → `move`__  ⁘\n- __`dailyreward` → `daily`__  ⁘\n- __`rinfo` → `roleinfo`__  ⁘\n- __`ri` → `roleinfo`__  ⁘\n- __`server` → `serverinfo`__  ⁘\n- __`s` → `serverinfo`__  ⁘\n- __`si` → `serverinfo`__  ⁘\n- __`guildinfo` → `serverinfo`__  ⁘\n- __`idsserver` → `serverinfo`__  ⁘\n- __`auto-tag` → `autotag`__  ⁘\n- __`namestag` → `autotag`__  ⁘\n- __`dban` → `dmban`__  ⁘\n- __`dmkick` → `dkick`__  ⁘\n- __`nick` → `nickname`__  ⁘\n- __`setnick` → `nickname`__  ⁘\n- __`latency` → `ping`__  ⁘\n- __`rel` → `reload`__  ⁘\n- __`togglerole` → `role`__  ⁘\n- __`kicknuke` → `softban`__  ⁘\n- __`removetimeout` → `untimeout`__  ⁘\n- __`nopre` → `noprefix`__  ⁘\n- __`np` → `noprefix`__  ⁘\n- __`alias` → `aliases`__  ⁘\n- __`cmdalias` → `aliases`__  ⁘\n- __`verifyboy` → `vb`__  ⁘\n- __`verifygirl` → `vg`__  ⁘\n- __`rvc` → `randommembervoice`__  ⁘\n- __`radd` → `roleadd`__  ⁘\n- __`rremove` → `roleremove`__  ⁘\n- __`padd` → `role`__  ⁘\n- __`c` → `balance`__  ⁘\n- __`credit` → `balance`__  ⁘\n- __`d` → `daily`__  ⁘\n- __`claimdaily` → `daily`__  ⁘\n- __`tr` → `transfer`__  ⁘\n- __`send` → `transfer`__  ⁘\n- __`gamble` → `luck`__  ⁘\n- __`bet` → `luck`__  ⁘\n- __`flip` → `rvpflip`__  ⁘\n- __`coinflip` → `rvpflip`__  ⁘\n- __`cf` → `rvpflip`__  ⁘\n- __`bj` → `blackjack`__  ⁘\n- __`inv` → `inventory`__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Aliases Add",
                          "disabled": true,
                          "custom_id": "setup_add_aliases_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Aliases Remove",
                          "custom_id": "setup_remove_aliases_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false,
              "ephemeral": true
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s3",
          "custom_id": "setup_clearsetup_1398395532103254157",
          "value": null,
          "global": true,
          "kind": "reply",
          "to": null,
          "reply": [
            {
              "content": "",
              "embeds": [],
              "components": [
                {
                  "type": 17,
                  "spoiler": false,
                  "components": [
                    {
                      "type": 12,
                      "items": [
                        {
                          "spoiler": false,
                          "media": {
                            "url": "https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&",
                            "content_scan_metadata": {
                              "version": 0,
                              "flags": 0
                            }
                          },
                          "description": "{{displayName}}'s server Clear Skip"
                        }
                      ]
                    },
                    {
                      "type": 10,
                      "content": "## <:param:1551750316867850291> Clear Skip"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- <:4151dropdownmenu:1551750312304443395> __Configure channels to skip when using clear command (max 25)__  ⁘"
                    },
                    {
                      "type": 14,
                      "spacing": 1,
                      "divider": true
                    },
                    {
                      "type": 10,
                      "content": "- __Current Skip Channels 0/25 :__  ⁘\n- __No skip channels configured__  ⁘"
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
                          "type": 2,
                          "style": 2,
                          "label": "Clear Skip Add",
                          "custom_id": "setup_add_clearsetup_1398395532103254157"
                        },
                        {
                          "type": 2,
                          "style": 2,
                          "label": "Clear Skip Remove",
                          "disabled": true,
                          "custom_id": "setup_remove_clearsetup_1398395532103254157"
                        }
                      ]
                    }
                  ],
                  "accent_color": 13944790
                }
              ],
              "v2": true,
              "attachments": [],
              "reply": false,
              "ping": false
            }
          ],
          "action": false,
          "modal": null
        },
        {
          "from": "s3",
          "custom_id": "setup_page_1398395532103254157_2",
          "value": null,
          "global": false,
          "kind": "update",
          "to": "s1",
          "reply": null,
          "action": false,
          "modal": null
        }
      ]
    }
  },
  async execute(message, args) {
    await replay(message, this, args);
  },
};

(() => {
  const { container } = require('../../utils/render/embeds');
  const { flow } = module.exports.recorded;
  const ID = (name) => `${name}_1398395532103254157`;
  const PAGES = 6;

  const PAGE_BUTTONS = {
    4: [
      ['setup_clanmanager', 'Manager', 'Configure clan manager roles for clan system'],
      ['setup_prefix', 'Prefix', 'Configure server prefix for commands'],
      ['setup_counter', 'Counter', 'Configure member and voice counter channels'],
      ['setup_roles_button', 'Roles', 'Configure various role settings for the server'],
    ],
    5: [
      ['setup_tempvoice', 'Temp Voice', 'Configure temporary voice channels'],
      ['setup_subscription', 'Subscription', 'Check premium subscription status'],
      ['setup_command', 'Manage', 'Enable or disable commands in your server'],
      ['setup_theme', 'Theme', 'Configure server theme accent color'],
    ],
    6: [
      ['setup_autoreply', 'Auto Reply', 'Configure auto replies for specific messages'],
      ['setup_noprefix', 'No Prefix', 'Configure commands that run without a prefix'],
      ['setup_azkar', 'Azkar', 'Send Azkar reminders to a channel on a schedule'],
    ],
  };

  function makePage(number, { nextDisabled = false } = {}) {
    const copy = JSON.parse(JSON.stringify(flow.states.s3));
    const card = copy.components[0];
    const sections = card.components.filter((c) => c.type === 9);
    const dropdown = sections[0].components[0].content.match(/^- (<:[^>]+>)/)[1];
    for (const spare of sections.slice(PAGE_BUTTONS[number].length)) card.components.splice(card.components.indexOf(spare) - 1, 2);
    PAGE_BUTTONS[number].forEach(([customId, name, text, disabled], i) => {
      sections[i].components[0].content = `- ${dropdown} __${text}__  ⁘`;
      Object.assign(sections[i].accessory, { custom_id: ID(customId), label: name });
      if (disabled) sections[i].accessory.disabled = true;
    });
    card.components.find((c) => c.type === 10 && c.content.startsWith('## Server Setup')).content = `## Server Setup • Page ${number}/${PAGES}`;
    const [prev, next] = card.components[card.components.length - 1].components;
    prev.custom_id = `${ID('setup_page')}_${number - 1}`;
    next.custom_id = `${ID('setup_page')}_${number + 1}`;
    if (nextDisabled) next.disabled = true;
    return copy;
  }
  flow.states.s4 = makePage(4);
  flow.states.s5 = makePage(5);
  flow.states.s6 = makePage(6, { nextDisabled: true });

  const notSetUp = (from, customId) => ({
    from,
    custom_id: customId,
    value: null,
    global: true,
    kind: 'reply',
    to: null,
    reply: [{
      content: '', embeds: [], components: [container({ title: 'Notice', lines: ['__This is not set up yet__'] })],
      v2: true, attachments: [], reply: false, ping: false, ephemeral: true,
    }],
    action: false,
    modal: null,
  });
  const page = (from, n, to) => ({
    from, custom_id: `${ID('setup_page')}_${n}`, value: null, global: false, kind: 'update', to, reply: null, action: false, modal: null,
  });

  flow.transitions.push(
    page('s3', 4, 's4'),
    page('s4', 3, 's3'),
    page('s4', 5, 's5'),
    page('s5', 4, 's4'),
    page('s5', 6, 's6'),
    page('s6', 5, 's5'),
    ...PAGE_BUTTONS[4].map(([customId]) => notSetUp('s4', ID(customId))),
    ...PAGE_BUTTONS[5].filter(([, , , disabled]) => !disabled).map(([customId]) => notSetUp('s5', ID(customId))),
    notSetUp('s6', ID('setup_autoreply')),
    notSetUp('s6', ID('setup_noprefix')),
    notSetUp('s6', ID('setup_azkar')),
  );

  for (const snap of [module.exports.recorded.replies[0], ...Object.values(flow.states)]) {
    const title = snap.components[0].components.find((c) => c.type === 10 && c.content.startsWith('## Server Setup'));
    if (title) title.content = title.content.replace(/\/3$/, `/${PAGES}`);
  }
})();
