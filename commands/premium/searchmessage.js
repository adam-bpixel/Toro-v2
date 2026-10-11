const { ComponentType } = require('discord.js');
const { replay } = require('../../utils/runtime/replay');
const { container, divider, notice, usageCard, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { serverAllowed } = require('../../models/economy/premium');
const cooldown = require('../../utils/runtime/cooldown');
const { EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const activeComponents = require('../../utils/runtime/activeComponents');

const SCAN = 1000;
const PER_PAGE = 10;
const COOLDOWN_MS = 10_000;
const IDLE_MS = 5 * 60 * 1000;
const EPHEMERAL = 1 << 6;
const PREV = 'searchmessage_prev';
const NEXT = 'searchmessage_next';

function render(found, query, page) {
  const pages = Math.ceil(found.length / PER_PAGE);
  const slice = found.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const lines = slice.map((m) => {
    const snippet = m.content.replace(/\s+/g, ' ');
    return `[Jump](${m.url}) <@${m.author.id}> <t:${Math.floor(m.createdTimestamp / 1000)}:R> : ${snippet.length > 80 ? `${snippet.slice(0, 79)}…` : snippet}`;
  });

  const parts = [
    { type: 10, content: `## Search : ${query.slice(0, 40)}` },
    divider(),
    { type: 10, content: lines.map((line) => `- ${line}  ⁘`).join('\n') },
    divider(),
    { type: 10, content: `-# Page ${page + 1}/${pages} — ${found.length} result${found.length === 1 ? '' : 's'}` },
    {
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: PREV, emoji: parseEmoji(EMOJI.left), disabled: page === 0 },
        { type: 2, style: 2, custom_id: NEXT, emoji: parseEmoji(EMOJI.right), disabled: page >= pages - 1 },
      ],
    },
  ];
  return {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }],
    allowedMentions: { parse: [] },
  };
}


module.exports = {
  name: "searchmessage",
  aliases: ['search', 'sm', 'searchmsg'],
  description: 'Search for messages in the server',
  usage: '<text>',
  category: 'Premium Commands',
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
                "type": 9,
                "components": [
                  {
                    "type": 10,
                    "content": "### <:prmfree:1551750382206718012> Premium Command\nThis command requires an **active Premium subscription**.\n\n[View Premium plans](<https://discord.gg/zk92wu2Vh>) for more information."
                  },
                  {
                    "type": 10,
                    "content": "**Premium Features**\n<:point:1551750386967122050> Exclusive server protection tools.\n<:point:1551750386967122050> Advanced moderation commands.\n<:point:1551750386967122050> **searchmessage** » Search for messages in the server\n<:point:1551750386967122050> Use `&subscription server` to check status."
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
  },
  async execute(message, args) {
    if (!(await serverAllowed(message))) return replay(message, this, args);
    if (!args.length) {
      return usageCard(message, {
        summary: 'Search the recent messages of this channel',
        usage: '&searchmessage <text>',
        notes: [`Looks through the last ${SCAN} messages`, 'Cooldown: 10 seconds'],
      });
    }
    const wait = cooldown.hit(`searchmessage:${message.guild.id}:${message.author.id}`, COOLDOWN_MS);
    if (wait.onCooldown) return notice(message, `__Please wait ${Math.ceil(wait.remainingMs / 1000)} seconds__`);

    const query = args.join(' ').toLowerCase();
    const found = [];
    let before;
    for (let scanned = 0; scanned < SCAN; scanned += 100) {
      const batch = await message.channel.messages.fetch({ limit: 100, ...(before && { before }) }).catch(() => null);
      if (!batch?.size) break;
      for (const m of batch.values()) {
        if (m.id !== message.id && m.content.toLowerCase().includes(query)) found.push(m);
      }
      before = batch.last().id;
    }
    if (!found.length) return notice(message, '__No messages found__');

    let page = 0;
    const sent = await message.reply({ ...render(found, args.join(' '), page), allowedMentions: { parse: [], repliedUser: false } });
    if (found.length <= PER_PAGE) return sent;

    activeComponents.claim(sent.id);
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, idle: IDLE_MS });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction
          .reply({ flags: EPHEMERAL | COMPONENTS_V2, components: [container({ title: 'Notice', lines: ['__Only the person who ran this command can use these buttons__'] })] })
          .catch(() => {});
      }
      const pages = Math.ceil(found.length / PER_PAGE);
      page = Math.min(Math.max(page + (interaction.customId === NEXT ? 1 : -1), 0), pages - 1);
      await interaction.update(render(found, args.join(' '), page));
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      await disablePanelMessage(message.guild, sent.channelId, sent.id);
    });
    return sent;
  },
};
