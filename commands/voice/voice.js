'use strict';
const { replay } = require('../../utils/runtime/replay');
const { card, notice } = require('../../utils/render/embeds');
const { serverAllowed } = require('../../models/economy/premium');
const { prefixesFor } = require('../../models/settings/prefix');
const { resolveUser, resolveRole } = require('../../utils/access/resolve');
const { run, containerPayload } = require('../../handlers/voice/voiceControls');
const { buildVoiceHelpPanel } = require('../../utils/render/voiceHelp');

const ACTIONS = new Set(['lock', 'unlock', 'ghost', 'reveal', 'name', 'limit', 'claim', 'kick', 'deny', 'perm', 'panel', 'activity', 'owner', 'info']);

module.exports = {
  name: 'voice',
  aliases: ['vc'],
  description: 'Control your temporary voice channel',
  usage: '<action> [options]',
  category: 'Voice Commands',
  recorded: {
    replies: [
      {
        content: '',
        embeds: [],
        components: [
          {
            type: 17,
            accent_color: 13944790,
            components: [
              {
                type: 9,
                components: [
                  {
                    type: 10,
                    content: '### <:prmfree:1551750382206718012> Premium Command\nThis command requires an **active Premium subscription**.\n\n[View Premium plans](<https://discord.gg/zk92wu2Vh>) for more information.',
                  },
                  {
                    type: 10,
                    content: '**Premium Features**\n<:point:1551750386967122050> Exclusive server protection tools.\n<:point:1551750386967122050> Advanced moderation commands.\n<:point:1551750386967122050> **voice** » Control your OneTap voice channel\n<:point:1551750386967122050> Use `&subscription server` to check status.',
                  },
                ],
                accessory: {
                  type: 11,
                  media: {
                    url: '{{botAvatar}}',
                  },
                  description: null,
                  spoiler: false,
                },
              },
              {
                type: 12,
                items: [
                  {
                    media: {
                      url: 'https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&',
                    },
                    description: null,
                    spoiler: false,
                  },
                ],
              },
              {
                type: 14,
                spacing: 1,
                divider: true,
              },
              {
                type: 10,
                content: '-# <:point:1551750386967122050> Join our [Support Server](<https://discord.gg/zk92wu2Vh>) or <:getpremium:1551750391841165342> purchase Premium directly via Discord.',
              },
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 6,
                    sku_id: '1523752469136670863',
                  },
                ],
              },
            ],
            spoiler: false,
          },
        ],
        v2: true,
        attachments: [],
        reply: true,
        ping: true,
      },
    ],
    reactions: [],
  },
  async execute(message, args) {
    if (!(await serverAllowed(message))) return replay(message, this, args);
    if (!message.guild) return notice(message, '__This command only works inside a server__');

    const sub = (args[0] || 'help').toLowerCase();
    if (!ACTIONS.has(sub)) {
      const { server, personal } = await prefixesFor(message.guild.id, message.author.id);
      return message.reply(buildVoiceHelpPanel(personal || server));
    }

    const extra = {};
    if (sub === 'name' || sub === 'limit') extra.value = args.slice(1).join(' ');
    if (sub === 'kick' || sub === 'deny') extra.target = await resolveUser(message, args.slice(1), { fallbackToAuthor: false });
    if (sub === 'perm') {
      const query = args.slice(1).join(' ').trim();
      extra.role = message.mentions.roles.first() || null;
      if (!extra.role) extra.target = await resolveUser(message, args.slice(1), { fallbackToAuthor: false });
      if (!extra.role && !extra.target) extra.role = resolveRole(message, query.replace(/^@/, ''));
    }

    const member = message.member || await message.guild.members.fetch(message.author.id);
    const result = await run(sub, member, extra);
    if (result.error) return notice(message, `__${result.error}__`);
    if (result.deleted) return null;
    if (result.container) return message.reply({ ...containerPayload(result.container), allowedMentions: { repliedUser: true, parse: [] } });

    const sent = await card(message, { title: 'Voice', lines: [`__${result.text}__`] });
    if (sub === 'panel') setTimeout(() => sent.delete().catch(() => {}), 5000);
    return sent;
  },
};
