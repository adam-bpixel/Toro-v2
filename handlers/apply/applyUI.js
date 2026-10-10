'use strict';
const { APPLY_EMOJI, TICKET_EMOJI } = require('../../utils/emojis');
const { COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { parseEmoji } = require('../tickets/ticketUI');

const POSITIONS = [
  { id: 'apply_staff_team', label: 'Staff Team', emoji: APPLY_EMOJI.staff, desc: 'Moderate and assist members' },
  { id: 'apply_designer', label: 'Designer', emoji: APPLY_EMOJI.designer, desc: 'Create visuals & graphics' },
  { id: 'apply_developer', label: 'Developer', emoji: APPLY_EMOJI.developer, desc: 'Build bots & features' },
  { id: 'apply_event_hoster', label: 'Event Hoster', emoji: APPLY_EMOJI.eventHoster, desc: 'Organize fun community events' },
  { id: 'apply_partnership', label: 'Partnership', emoji: APPLY_EMOJI.partnership, desc: 'Build server relationships' },
];

function buttonRows() {
  const buttons = POSITIONS.map((p) => ({ type: 2, style: 2, custom_id: p.id, label: p.label, emoji: parseEmoji(p.emoji) }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 3) rows.push({ type: 1, components: buttons.slice(i, i + 3) });
  return rows;
}

function selectRow() {
  return {
    type: 1,
    components: [
      {
        type: 3,
        custom_id: 'staff_apply_select',
        placeholder: 'Select a position to apply for',
        min_values: 1,
        max_values: 1,
        options: POSITIONS.map((p) => ({ label: p.label, value: p.id, emoji: parseEmoji(p.emoji) })),
      },
    ],
  };
}

function buildApplyPanel(guild, style, imageURL) {
  const parts = [
    { type: 10, content: `## ${guild.name} • Staff Applications` },
    { type: 14, spacing: 1, divider: true },
    {
      type: 9,
      components: [
        {
          type: 10,
          content: "- __We're looking for active and dedicated members to join our team and help our community grow!__  ⁘",
        },
      ],
      accessory: {
        type: 11,
        media: { url: guild.iconURL({ size: 512 }) || 'https://cdn.discordapp.com/embed/avatars/0.png' },
        description: 'Server Icon',
        spoiler: false,
      },
    },
    { type: 14, spacing: 1, divider: true },
    { type: 10, content: POSITIONS.map((p) => `- ${p.emoji} **${p.label}** : \`${p.desc}\` ﾒ`).join('\n\n') },
    { type: 14, spacing: 1, divider: true },
    { type: 10, content: `- ${TICKET_EMOJI.footer} ༯ __Click the button below to submit your application. Serious applicants only!__` },
  ];
  if (imageURL) {
    parts.push(
      { type: 14, spacing: 1, divider: true },
      { type: 12, items: [{ media: { url: imageURL }, description: 'Application panel image', spoiler: false }] },
    );
  }
  parts.push({ type: 14, spacing: 1, divider: true }, ...(style === 'menu' ? [selectRow()] : buttonRows()));
  return { flags: COMPONENTS_V2, components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }] };
}

module.exports = {
  POSITIONS,
  buttonRows,
  selectRow,
  buildApplyPanel,
};
