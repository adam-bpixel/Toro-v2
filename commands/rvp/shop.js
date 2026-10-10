'use strict';
const { shopListings, buyProfile } = require('../../models/economy/profiles');
const { COMPONENTS_V2, ACCENT_COLOR, container, textBlock, divider } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const activeComponents = require('../../utils/runtime/activeComponents');

const PAGE_SIZE = 2;
const IDLE_MS = 5 * 60 * 1000;
const PREV_ID = 'shop_prev';
const NEXT_ID = 'shop_next';
const BUY_PREFIX = 'buybackground_';
const EPHEMERAL = 1 << 6;

function itemBlock(profile) {
  return [
    textBlock(`**${profile.name}** | ${EMOJI.coin} ${comma(profile.price)} | ${EMOJI.box} ${profile.profileId}`),
    { type: 12, items: [{ media: { url: profile.previewUrl || profile.imageUrl }, description: null, spoiler: false }] },
    divider(),
    {
      type: 1,
      components: [{ type: 2, style: 3, custom_id: `${BUY_PREFIX}${profile.profileId}`, label: comma(profile.price), emoji: parseEmoji(EMOJI.coin) }],
    },
    divider(),
  ];
}

function buildPage(listings, page) {
  const pages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const clamped = Math.min(Math.max(page, 0), pages - 1);
  const shown = listings.slice(clamped * PAGE_SIZE, clamped * PAGE_SIZE + PAGE_SIZE);

  const parts = [
    textBlock(`## Background Shop - Page ${clamped + 1}/${pages}`),
    divider(),
    ...shown.flatMap(itemBlock),
    {
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: PREV_ID, emoji: parseEmoji(EMOJI.left), disabled: clamped === 0 },
        { type: 2, style: 2, custom_id: NEXT_ID, emoji: parseEmoji(EMOJI.right), disabled: clamped >= pages - 1 },
      ],
    },
  ];

  return {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }],
    allowedMentions: { parse: [] },
  };
}

const notYours = (interaction) => interaction
  .reply({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title: 'Notice', lines: ['__Only the person who ran this command can use these buttons__'] })] })
  .catch(() => {});

module.exports = {
  name: 'shop',
  aliases: ['backgroundshop', 'bgshop'],
  description: 'Browse and buy profile backgrounds',
  usage: '',
  category: 'Rvp System',
  async execute(message) {
    const listings = await shopListings();
    if (!listings.length) {
      return message.reply({
        flags: COMPONENTS_V2,
        components: [container({ title: 'Background Shop', lines: ['__Nothing is in the shop yet__'] })],
        allowedMentions: { parse: [] },
      });
    }

    let page = 0;
    const sent = await message.reply({ ...buildPage(listings, page), allowedMentions: { parse: [], repliedUser: false } });
    activeComponents.claim(sent.id);

    const collector = sent.createMessageComponentCollector({ idle: IDLE_MS });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) return notYours(interaction);
      if (interaction.replied || interaction.deferred) return;
      try {
        if (interaction.customId === PREV_ID || interaction.customId === NEXT_ID) {
          page += interaction.customId === NEXT_ID ? 1 : -1;
          const fresh = await shopListings();
          return await interaction.update(buildPage(fresh, page));
        }
        if (interaction.customId.startsWith(BUY_PREFIX)) {
          const profileId = Number(interaction.customId.slice(BUY_PREFIX.length));
          const result = await buyProfile(interaction.user.id, profileId);
          const notice = result.ok ? `${EMOJI.success} __Bought and equipped__ **${result.profile.name}**` : result.notice;
          return await interaction.reply({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title: 'Background Shop', lines: [notice] })] });
        }
      } catch (error) {
        console.error('Shop interaction failed:', error);
      }
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      if (message.guild) await disablePanelMessage(message.guild, sent.channelId, sent.id);
    });
  },
};
