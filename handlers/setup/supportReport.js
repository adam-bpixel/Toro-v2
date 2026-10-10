'use strict';
const { COMPONENTS_V2, ACCENT_COLOR, container } = require('../../utils/render/embeds');
const { ROLE_REQUEST_EMOJI: E, TICKET_EMOJI } = require('../../utils/emojis');
const { OPEN_COLOR, CLOSE_COLOR } = require('../tickets/ticketActions');

const EPHEMERAL = 1 << 6;
const MENU_ID = 'support_menu';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_FIELD_SHOWN = 900;

const KINDS = {
  bug: {
    option: 'bugs',
    modalId: 'bug_report_modal',
    modalTitle: 'Report a Bug or Error',
    reportTitle: 'New Bug Report',
    dmTitle: 'Bug Report Decision',
    descLabel: 'Describe the bug',
    descPlaceholder: 'What happened? What did you expect to happen?',
    proofLabel: 'Screenshot / Screen Recording',
    acceptLabel: 'Fixed',
    rejectLabel: 'Invalid',
    acceptedVerdict: 'Marked as Fixed',
    rejectedVerdict: 'Marked as Invalid',
  },
  abuse: {
    option: 'abuse',
    modalId: 'abuse_report_modal',
    modalTitle: 'Report Abuse or Rule Violation',
    reportTitle: 'New Abuse Report',
    dmTitle: 'Abuse Report Decision',
    descLabel: 'Describe the violation',
    descPlaceholder: 'Who was involved and what did they do?',
    proofLabel: 'Proof (Image / Video)',
    acceptLabel: 'Handled',
    rejectLabel: 'Dismissed',
    acceptedVerdict: 'Handled by Staff',
    rejectedVerdict: 'Dismissed',
  },
};

const MODAL_IDS = Object.values(KINDS).map((k) => k.modalId);
const kindOfModal = (id) => Object.values(KINDS).find((k) => k.modalId === id);
const kindOfDecision = (id) => (id.startsWith('support_acc_') || id.startsWith('support_rej_') ? (id.startsWith('support_acc_') ? 'accept' : 'reject') : null);

const isSupportInteraction = (interaction) =>
  (interaction.isStringSelectMenu() && interaction.customId === MENU_ID) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId)) ||
  (interaction.isButton() && (interaction.customId.startsWith('support_acc_') || interaction.customId.startsWith('support_rej_')));

const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildModal(kind) {
  return {
    title: kind.modalTitle,
    custom_id: kind.modalId,
    components: [
      {
        type: 18,
        label: kind.descLabel,
        component: { type: 4, custom_id: 'report_desc', style: 2, placeholder: kind.descPlaceholder, min_length: 10, max_length: 1000, required: true },
      },
      {
        type: 18,
        label: kind.proofLabel,
        description: 'Upload a screenshot or screen recording (optional)',
        component: { type: 19, custom_id: 'report_proof', min_values: 0, max_values: 1, required: false, file_types: ['image', 'video'] },
      },
    ],
  };
}

async function handleMenu(interaction) {
  const chosen = interaction.values[0];
  const kind = Object.values(KINDS).find((k) => k.option === chosen);
  if (!kind) return interaction.reply(notice('__Unknown option__'));
  return interaction.showModal(buildModal(kind));
}

const bullet = (text) => `- ${text.trim().replace(/\n/g, '\n  ')}  ⁘`;
const DIVIDER = { type: 14, spacing: 1, divider: true };

function buildReportCard(kind, guild, user, text, attachmentUrl, isVideo = false) {
  const submittedAt = Date.now();
  const desc = text.length > MAX_FIELD_SHOWN ? `${text.slice(0, MAX_FIELD_SHOWN - 1)}…` : text;
  const components = [
    { type: 10, content: `## ${TICKET_EMOJI.header} ${kind.reportTitle}` },
    DIVIDER,
    {
      type: 9,
      components: [{ type: 10, content: `${bullet(`__Sender:__ ${user.username}`)}\n${bullet(`__User ID:__ ${user} / ${user.id}`)}` }],
      accessory: { type: 11, media: { url: user.displayAvatarURL({ size: 128 }) }, description: 'Sender Avatar', spoiler: false },
    },
    DIVIDER,
    { type: 10, content: `### Description\n${bullet(desc)}` },
  ];

  if (attachmentUrl && !isVideo) {
    components.push(DIVIDER, {
      type: 12,
      items: [{ media: { url: attachmentUrl }, description: 'Proof attachment', spoiler: false }],
    });
  }

  components.push(
    DIVIDER,
    { type: 10, content: `### Submitted\n- <t:${Math.floor(submittedAt / 1000)}:R>  ⁘` },
    {
      type: 1,
      components: [
        { type: 2, style: 3, custom_id: `support_acc_${user.id}_${submittedAt}`, label: kind.acceptLabel },
        { type: 2, style: 4, custom_id: `support_rej_${user.id}_${submittedAt}`, label: kind.rejectLabel },
      ],
    },
  );

  return {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [{ type: 17, accent_color: ACCENT_COLOR, components, spoiler: false }],
  };
}

async function handleSubmit(interaction) {
  const kind = kindOfModal(interaction.customId);
  if (!kind) return;

  const desc = interaction.fields.getTextInputValue('report_desc');
  const uploaded = interaction.fields.getUploadedFiles('report_proof', false)?.first();

  if (uploaded && uploaded.size > MAX_IMAGE_BYTES) {
    return interaction.reply(notice('__That file is too large - maximum size is 10 MB__'));
  }

  const supportGuildId = process.env.SUPPORT_SERVER_ID;
  const channelId = kind.option === 'bugs' ? process.env.BUG_REPORT_CHANNEL_ID : process.env.ABUSE_REPORT_CHANNEL_ID;

  let targetChannel = null;
  if (supportGuildId && channelId) {
    const supportGuild = interaction.client.guilds.cache.get(supportGuildId);
    if (supportGuild) targetChannel = supportGuild.channels.cache.get(channelId);
  }

  if (!targetChannel) {
    return interaction.reply(notice('__Thank you for your report! Our team has been notified.__', `${E.staff} Report Received`));
  }

  const isVideo = uploaded?.contentType?.startsWith('video/');
  const card = buildReportCard(kind, interaction.guild, interaction.user, desc, uploaded?.url, isVideo);

  try {
    await targetChannel.send(card);
    if (uploaded && isVideo) await targetChannel.send({ content: `**Video Proof:** ${uploaded.url}` });
  } catch (error) {
    console.error('Support report send failed:', error);
  }

  return interaction.reply(notice('__Thank you for your report! Our team has received it.__', `${E.staff} Report Sent`));
}

async function handleDecision(interaction) {
  const isAccept = interaction.customId.startsWith('support_acc_');
  const [, , applicantId] = interaction.customId.split('_');

  const card = interaction.message.components[0].toJSON();
  const title = card.components[0]?.content || '';
  const isBug = title.includes('Bug');
  const kind = isBug ? KINDS.bug : KINDS.abuse;

  const verdict = isAccept ? kind.acceptedVerdict : kind.rejectedVerdict;
  const color = isAccept ? OPEN_COLOR : CLOSE_COLOR;

  card.components = [...card.components.slice(0, -1), { type: 10, content: `- __${verdict} by__ ${interaction.user}  ⁘` }];
  await interaction.update({ flags: COMPONENTS_V2, components: [card], allowedMentions: { parse: [] } });

  interaction.client.users.fetch(applicantId).then((user) => {
    user.send({
      flags: COMPONENTS_V2,
      components: [container({
        title: kind.dmTitle,
        accentColor: color,
        fields: [
          `**Decision:** ${verdict}`,
          `**Reviewed By:** ${interaction.user.username}`,
          `**Reviewed At:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ],
      })],
    }).catch(() => {});
  }).catch(() => {});
}

async function handleSupportInteraction(interaction) {
  if (interaction.isStringSelectMenu() && interaction.customId === MENU_ID) return handleMenu(interaction);
  if (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId)) return handleSubmit(interaction);
  if (interaction.isButton() && (interaction.customId.startsWith('support_acc_') || interaction.customId.startsWith('support_rej_'))) {
    return handleDecision(interaction);
  }
}

module.exports = { isSupportInteraction, handleSupportInteraction };
