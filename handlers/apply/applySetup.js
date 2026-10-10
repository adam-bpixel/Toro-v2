'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, patchApplyConfig } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { rehostImage } = require('../../services/imageHost');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const { APPLY_EMOJI, EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../tickets/ticketUI');
const { OPEN_COLOR, CLOSE_COLOR } = require('../tickets/ticketActions');
const { peek, start } = require('../../utils/runtime/cooldown');
const { duration } = require('../../utils/format');
const { POSITIONS, buildApplyPanel } = require('./applyUI');

const EPHEMERAL = 1 << 6;
const APPLY_BUTTON_ID = 'setup_staffapply_1398395532103254157';
const APPLY_MODAL_ID = 'apply_setup_modal';
const APPLY_SELECT_ID = 'staff_apply_select';
const APPLY_FORM_PREFIX = 'apply_form_';
const MIN_ANSWER_LENGTH = 10;
const SUBMIT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

const FORM_FIELDS = {
  name: 'apply_full_name',
  age: 'apply_age',
  experience: 'apply_experience',
  why: 'apply_why',
  hours: 'apply_hours',
};

const isApplyComponent = (customId) => customId === APPLY_SELECT_ID || customId.startsWith('apply_');
const isApplyDecision = (customId) => customId.startsWith('appaccept_') || customId.startsWith('appreject_');

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const notice = (line, title = 'Notice') => ({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title, lines: [line] })] });

function channelDefault(guild, existingChannelId) {
  return existingChannelId && guild.channels.cache.has(existingChannelId)
    ? [{ type: 'channel', id: existingChannelId }]
    : undefined;
}

function buildApplySetupModal(guild, config = {}) {
  return {
    title: 'Staff Application Setup',
    custom_id: APPLY_MODAL_ID,
    components: [
      label('Panel Channel', 'Where the "apply" panel is posted', {
        type: 8,
        custom_id: 'apply_panel_channel',
        channel_types: [ChannelType.GuildText],
        min_values: 1,
        max_values: 1,
        default_values: channelDefault(guild, config.applyPanelChannelId),
      }),
      label('Review Channel', 'Where submitted applications are sent for review', {
        type: 8,
        custom_id: 'apply_review_channel',
        channel_types: [ChannelType.GuildText],
        min_values: 1,
        max_values: 1,
        default_values: channelDefault(guild, config.applyReviewChannelId),
      }),
      label('Panel Style', 'Buttons or a dropdown menu', {
        type: 3,
        custom_id: 'apply_panel_style',
        min_values: 1,
        max_values: 1,
        options: [
          { label: 'Buttons', value: 'button', description: 'A row of buttons, one per position', default: config.applyPanelStyle === 'button' },
          { label: 'Select Menu', value: 'menu', description: 'A single dropdown with every position', default: config.applyPanelStyle === 'menu' },
        ],
      }),
      label('Panel Image (optional)', 'Shown above the buttons', {
        type: 19,
        custom_id: 'apply_panel_image',
        min_values: 0,
        max_values: 1,
        required: false,
        file_types: ['image'],
      }),
    ],
  };
}

function buildApplicationModal(position) {
  const input = (id, labelText, style, placeholder, extra = {}) => ({
    type: 1,
    components: [{ type: 4, custom_id: id, style, label: labelText, placeholder, required: true, ...extra }],
  });
  return {
    title: `${position.label} Application`,
    custom_id: `${APPLY_FORM_PREFIX}${position.id.slice('apply_'.length)}`,
    components: [
      input(FORM_FIELDS.name, 'Full Name', 1, 'Your name', { max_length: 100 }),
      input(FORM_FIELDS.age, 'Age', 1, '18', { max_length: 3 }),
      input(FORM_FIELDS.experience, `${position.label} Experience`, 2, 'Tell us about your relevant experience...', {
        min_length: MIN_ANSWER_LENGTH,
        max_length: 800,
      }),
      input(FORM_FIELDS.why, `Why ${position.label}?`, 2, 'Why do you want this position?', {
        min_length: MIN_ANSWER_LENGTH,
        max_length: 800,
      }),
      input(FORM_FIELDS.hours, 'Daily Availability hours', 1, '5-8 hours', { max_length: 50 }),
    ],
  };
}

async function getReviewChannel(guild) {
  const config = await getGuildConfig(guild.id);
  const channel = config.applyReviewChannelId ? guild.channels.cache.get(config.applyReviewChannelId) : null;
  return channel && channel.isTextBased() ? channel : null;
}

async function openApplyConfigPanel(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to configure applications__'));
  }
  const config = await getGuildConfig(interaction.guild.id);
  await interaction.showModal(buildApplySetupModal(interaction.guild, config));
}

async function handleApplySetupModalSubmit(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to configure applications__'));
  }
  await interaction.deferReply({ flags: EPHEMERAL });
  const previous = await getGuildConfig(interaction.guild.id);

  const panelChannel = interaction.fields.getSelectedChannels('apply_panel_channel', true, [ChannelType.GuildText]).first();
  const reviewChannel = interaction.fields.getSelectedChannels('apply_review_channel', true, [ChannelType.GuildText]).first();
  const style = interaction.fields.getStringSelectValues('apply_panel_style')[0];
  const uploadedImage = interaction.fields.getUploadedFiles('apply_panel_image', false)?.first();

  const patch = { panelChannelId: panelChannel.id, reviewChannelId: reviewChannel.id, panelStyle: style };
  let imageError = false;
  if (uploadedImage) {
    try {
      patch.panelImageURL = await rehostImage(uploadedImage);
    } catch (error) {
      console.error('Apply panel image rehost failed:', error);
      imageError = true;
    }
  }
  await patchApplyConfig(interaction.guild.id, patch);

  const config = await getGuildConfig(interaction.guild.id);
  const panelChannelLive = interaction.guild.channels.cache.get(panelChannel.id);
  await disablePanelMessage(interaction.guild, previous.applyPanelChannelId, previous.applyPanelMessageId);
  const posted =
    panelChannelLive && (await panelChannelLive.send(buildApplyPanel(interaction.guild, style, config.applyPanelImageURL)).catch(() => null));
  if (posted) await patchApplyConfig(interaction.guild.id, { panelMessageId: posted.id });

  const lines = [
    `__Panel Channel__ : ${panelChannel}`,
    `__Review Channel__ : ${reviewChannel}`,
    `__Panel Style__ : \`${style}\``,
  ];
  if (uploadedImage) lines.push(imageError ? "__Panel Image__ : couldn't upload it, kept the previous one" : '__Panel Image__ : updated');
  lines.push(posted ? '__Saved__ - the application panel has been posted' : "__Saved__ - but I couldn't post the panel (check my permissions in that channel)");

  await interaction.editReply({
    flags: COMPONENTS_V2,
    components: [container({ title: 'Staff Application Setup', lines })],
  });
}

async function handleApplyInteraction(interaction) {
  const positionId = interaction.isStringSelectMenu() ? interaction.values[0] : interaction.customId;
  const position = POSITIONS.find((p) => p.id === positionId);
  if (!position) return interaction.reply(notice('__Unknown position__'));
  if (!(await getReviewChannel(interaction.guild))) return interaction.reply(notice("__Applications aren't open yet__"));
  await interaction.showModal(buildApplicationModal(position));
}

const bullet = (text) => `- ${text.trim().replace(/\n/g, '\n  ')}  ⁘`;
const DIVIDER = { type: 14, spacing: 1, divider: true };

function buildReviewCard(guild, user, position, answers) {
  const submittedAt = Date.now();
  const block = (heading, value) => [{ type: 10, content: `${heading}\n${bullet(value)}` }, DIVIDER];
  return {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 10, content: `## ${APPLY_EMOJI.review} New Staff Application` },
          DIVIDER,
          {
            type: 9,
            components: [{ type: 10, content: `${bullet(`__Applicant:__ ${user.username}`)}\n${bullet(`__User ID:__ ${user} / ${user.id}`)}` }],
            accessory: { type: 11, media: { url: user.displayAvatarURL({ size: 128 }) }, description: 'Applicant', spoiler: false },
          },
          DIVIDER,
          ...block('### Full Name', answers.name),
          ...block('### Age', answers.age),
          ...block('### Position', position.label),
          ...block('### Staff Experience', answers.experience),
          ...block('### Why Staff?', answers.why),
          ...block('### Daily Availability hours', answers.hours),
          ...block('### Submitted', `<t:${Math.floor(submittedAt / 1000)}:R>`),
          {
            type: 1,
            components: [
              { type: 2, style: 3, custom_id: `appaccept_${guild.id}_${user.id}_${submittedAt}`, label: 'Accept', emoji: parseEmoji(APPLY_EMOJI.accept) },
              { type: 2, style: 4, custom_id: `appreject_${guild.id}_${user.id}_${submittedAt}`, label: 'Reject', emoji: parseEmoji(APPLY_EMOJI.reject) },
            ],
          },
        ],
        spoiler: false,
      },
    ],
  };
}

const dmCard = (title, accentColor, fields) => ({
  flags: COMPONENTS_V2,
  components: [container({ title, accentColor, fields })],
  allowedMentions: { parse: [] },
});

function positionOfCard(card) {
  const block = card.components.find((c) => c.type === 10 && c.content.startsWith('### Position\n'));
  return block ? block.content.replace('### Position\n- ', '').replace(/ {2}⁘$/, '') : null;
}

async function handleApplyDecision(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to review applications__'));
  }
  const [kind, , applicantId] = interaction.customId.split('_');
  const accepted = kind === 'appaccept';
  const emoji = accepted ? APPLY_EMOJI.accept : APPLY_EMOJI.reject;
  const verdict = accepted ? 'Accepted' : 'Rejected';

  const card = interaction.message.components[0].toJSON();
  const position = positionOfCard(card);
  card.components = [...card.components.slice(0, -1), { type: 10, content: `- ${emoji} __${verdict} by__ ${interaction.user}  ⁘` }];
  await interaction.update({ flags: COMPONENTS_V2, components: [card], allowedMentions: { parse: [] } });

  interaction.client.users
    .fetch(applicantId)
    .then((applicant) =>
      applicant.send(
        dmCard(`${emoji} Application ${verdict}`, accepted ? OPEN_COLOR : CLOSE_COLOR, [
          `**Server:** ${interaction.guild.name}`,
          ...(position ? [`**Position:** ${position}`] : []),
          `**Reviewed By:** ${interaction.user}`,
          `**Reviewed At:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          accepted ? '__Congratulations, welcome to the team!__' : '__Thank you for applying - we appreciate your time__',
        ]),
      ),
    )
    .catch(() => {});
}

async function handleApplicationSubmit(interaction) {
  const key = interaction.customId.slice(APPLY_FORM_PREFIX.length);
  const position = POSITIONS.find((p) => p.id === `apply_${key}`);
  if (!position) return interaction.reply(notice('__Unknown position__'));
  const cooldownKey = `staffapply:${interaction.user.id}`;
  const cd = peek(cooldownKey, SUBMIT_COOLDOWN_MS);
  if (cd.onCooldown) return interaction.reply(notice(`__You can apply again in ${duration(cd.remainingMs)}__`));

  const answers = {
    name: interaction.fields.getTextInputValue(FORM_FIELDS.name),
    age: interaction.fields.getTextInputValue(FORM_FIELDS.age),
    experience: interaction.fields.getTextInputValue(FORM_FIELDS.experience),
    why: interaction.fields.getTextInputValue(FORM_FIELDS.why),
    hours: interaction.fields.getTextInputValue(FORM_FIELDS.hours),
  };

  const reviewChannel = await getReviewChannel(interaction.guild);
  const sent = reviewChannel && (await reviewChannel.send(buildReviewCard(interaction.guild, interaction.user, position, answers)).catch((error) => {
    console.error('Apply review post failed:', error);
    return null;
  }));
  if (!sent) return interaction.reply(notice("__I couldn't send your application - please let an admin know__"));

  start(cooldownKey);
  interaction.user
    .send(
      dmCard(`${APPLY_EMOJI.review} Application Submitted`, ACCENT_COLOR, [
        `**Server:** ${interaction.guild.name}`,
        `**Position:** ${position.label}`,
        `**Submitted:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        '__Our team will review your application and let you know the result here__',
      ]),
    )
    .catch(() => {});

  await interaction.reply(notice(`__Your ${position.label} application has been submitted__`, `${EMOJI.success} Success`));
}

module.exports = {
  openApplyConfigPanel,
  handleApplySetupModalSubmit,
  buildApplyPanel,
  handleApplyInteraction,
  handleApplicationSubmit,
  handleApplyDecision,
  isApplyComponent,
  isApplyDecision,
  APPLY_BUTTON_ID,
  APPLY_MODAL_ID,
  APPLY_FORM_PREFIX,
};
