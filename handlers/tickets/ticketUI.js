'use strict';
const { TICKET_EMOJI } = require('../../utils/emojis');
const { COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');

const CATEGORIES = [
  { id: 'pub', label: 'Pub', emoji: TICKET_EMOJI.pub, desc: 'Report spam or pub' },
  { id: 'bugs', label: 'Bugs', emoji: TICKET_EMOJI.bugs, desc: 'Report bugs or issues' },
  { id: 'abuse', label: 'Abuse', emoji: TICKET_EMOJI.abuse, desc: 'Report abuse or harassment' },
  { id: 'server', label: 'Server', emoji: TICKET_EMOJI.server, desc: 'Server info or requests' },
  { id: 'staff', label: 'Staff Abuse', emoji: TICKET_EMOJI.staff, desc: 'Report staff issues' },
  { id: 'donate', label: 'Donate', emoji: TICKET_EMOJI.donate, desc: 'Support the server', style: 3 },
];

function parseEmoji(tag) {
  const match = tag.match(/^<(a?):([^:]+):(\d+)>$/);
  return match ? { id: match[3], name: match[2], animated: Boolean(match[1]) } : undefined;
}

const MAX_CUSTOM = 6;
const withCustom = (custom = []) => [...CATEGORIES, ...custom.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji || TICKET_EMOJI.header, desc: c.desc || 'Open a ticket' }))];
const emojiOf = (tag) => parseEmoji(tag) || (tag ? { name: tag } : undefined);

function buttonRows(categories) {
  const buttons = categories.map((c) => ({
    type: 2,
    style: c.style || 2,
    custom_id: `ticket_${c.id}`,
    label: c.label,
    emoji: emojiOf(c.emoji),
  }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 3) rows.push({ type: 1, components: buttons.slice(i, i + 3) });
  return rows;
}

function selectRow(categories) {
  return {
    type: 1,
    components: [
      {
        type: 3,
        custom_id: 'ticket_select',
        placeholder: 'Choose a ticket category',
        min_values: 1,
        max_values: 1,
        options: categories.map((c) => ({ label: c.label, value: c.id, description: c.desc, emoji: emojiOf(c.emoji) })),
      },
    ],
  };
}

function buildTicketPanel(guild, style, imageURL, custom = []) {
  const categories = withCustom(custom);
  const parts = [
    { type: 10, content: `## ${TICKET_EMOJI.header} ${guild.name} • Ticket Support System` },
    { type: 14, spacing: 1, divider: true },
    {
      type: 9,
      components: [
        {
          type: 10,
          content: '- __We want to keep our community safe, friendly, and fun for everyone. Pick a category below and our team will help!__  ⁘',
        },
      ],
      accessory: {
        type: 11,
        media: { url: guild.iconURL({ size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png' },
        description: 'Server Icon',
        spoiler: false,
      },
    },
    { type: 14, spacing: 1, divider: true },
    { type: 10, content: categories.map((c) => `- ${c.emoji} **${c.label}** : \`${c.desc}\``).join('\n\n') },
    { type: 14, spacing: 1, divider: true },
    { type: 10, content: `${TICKET_EMOJI.footer} __Use these modules for assistance or to report issues. Our team is here to help!__` },
  ];
  if (imageURL) {
    parts.push(
      { type: 14, spacing: 1, divider: true },
      { type: 12, items: [{ media: { url: imageURL }, description: 'Ticket panel image', spoiler: false }] },
    );
  }
  parts.push({ type: 14, spacing: 1, divider: true }, ...(style === 'menu' ? [selectRow(categories)] : buttonRows(categories)));
  return { flags: COMPONENTS_V2, components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }] };
}

function buildTicketOpenPanel({ guild, user, category, number }) {
  return {
    flags: COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 10, content: `${user}` },
          { type: 14, spacing: 1, divider: true },
          {
            type: 9,
            components: [{ type: 10, content: `**Ticket #${number}**` }],
            accessory: {
              type: 11,
              media: { url: user.displayAvatarURL({ size: 256 }) },
              description: `${user.username} avatar`,
              spoiler: false,
            },
          },
          { type: 14, spacing: 1, divider: true },
          { type: 10, content: `Hello ${user}, welcome to your ticket` },
          { type: 14, spacing: 1, divider: true },
          {
            type: 10,
            content: `**Ticket Details**\n> **Type:** \`${category.id}\`\n> **Created By:** ${user}\n> **ID:** \`#${number}\``,
          },
          { type: 14, spacing: 1, divider: true },
          {
            type: 9,
            components: [{ type: 10, content: '**Actions**\n> Use button below to close ticket' }],
            accessory: { type: 2, custom_id: 'close_ticket', style: 2, label: 'Close Ticket' },
          },
          { type: 14, spacing: 1, divider: false },
          { type: 10, content: `**${guild.name} • Ticket System**` },
        ],
        spoiler: false,
      },
    ],
  };
}

module.exports = {
  buildTicketPanel,
  buildTicketOpenPanel,
  CATEGORIES,
  parseEmoji,
  withCustom,
  MAX_CUSTOM,
};
