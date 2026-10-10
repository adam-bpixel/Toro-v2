'use strict';
const { COMPONENTS_V2 } = require('../../utils/render/embeds');
const { SUGGEST_EMOJI: E } = require('../../utils/emojis');
const { getSuggestConfig } = require('../../models/core/moderation');

const EPHEMERAL = 1 << 6;
const PANEL_BUTTON_ID = 'feature_suggest_button';
const MODAL_ID = 'sg_modal_suggest';
const MAX_FIELD_SHOWN = 900;

const FIELDS = { title: 'sg_title', description: 'sg_description', why: 'sg_why' };

const isSuggestInteraction = (interaction) =>
  (interaction.isButton() && interaction.customId === PANEL_BUTTON_ID) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID) ||
  (interaction.isButton() && /^sg_(accept|reject)_/.test(interaction.customId));


const text = (content) => ({ type: 10, content });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const bullet = (line) => `- ${line}  ⁘`;
const indent = (value) => value.trim().replace(/\n/g, '\n  ');
const shorten = (value) => (value.length > MAX_FIELD_SHOWN ? `${value.slice(0, MAX_FIELD_SHOWN)}…` : value);
const notice = (lines) => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  allowedMentions: { parse: [] },
  components: [{
    type: 17,
    components: [text('## Notice'), divider(), text((Array.isArray(lines) ? lines : [lines]).map(bullet).join('\n'))],
    spoiler: false,
  }],
});

function emojiObject(tag) {
  const match = /^<(a?):(\w+):(\d+)>$/.exec(tag);
  return match ? { id: match[3], name: match[2], animated: Boolean(match[1]) } : undefined;
}

function buildSuggestPanel(botName) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: null,
      components: [
        text(`## ${E.header} Feature Suggestions\n\n*Have an idea for the bot? Share your suggestions to help us improve!*`),
        divider(),
        text('- **New Features** \n  » Suggest completely new functionality  ⁘'),
        divider(),
        text('- **Improvements** \n  » Enhance existing features and commands  ⁘'),
        divider(),
        text('- **Quality of Life** \n  » Small changes that make a big difference  ⁘'),
        divider(),
        { type: 1, components: [{ type: 2, custom_id: PANEL_BUTTON_ID, style: 2, label: 'Suggest a Feature' }] },
        divider(),
        text(`-# Your feedback helps make ${botName} better  ⁘`),
      ],
      spoiler: false,
    }],
  };
}

function buildSuggestModal() {
  return {
    title: 'Suggest a Feature',
    custom_id: MODAL_ID,
    components: [
      { type: 18, label: 'Feature Title', component: { type: 4, custom_id: FIELDS.title, style: 1, placeholder: 'Short name for your idea', required: true, max_length: 100 } },
      { type: 18, label: 'Feature Description', component: { type: 4, custom_id: FIELDS.description, style: 2, placeholder: 'Explain what you want added or changed', required: true, max_length: 1000 } },
      { type: 18, label: 'Why would this be useful?', component: { type: 4, custom_id: FIELDS.why, style: 2, placeholder: 'Optional - Explain the benefits of this feature', required: false, max_length: 500 } },
    ],
  };
}

function reviewCard({ user, guild, title, description, why }) {
  const details = [
    bullet(`__User :__ ${user} \`${user.id}\``),
    bullet(`__Server :__ ${guild ? `${guild.name} \`${guild.id}\`` : 'Direct messages'}`),
    bullet(`__Submitted :__ <t:${Math.floor(Date.now() / 1000)}:R>`),
    bullet(`__Title :__ ${title}`),
    bullet(`__Description :__ ${indent(shorten(description))}`),
    ...(why ? [bullet(`__Why :__ ${indent(shorten(why))}`)] : []),
  ];
  return {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [{
      type: 17,
      components: [
        text(`## ${E.header} Feature Suggestion`),
        divider(),
        ...details.flatMap((line, i) => (i ? [divider(), text(line)] : [text(line)])),
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 3, custom_id: `sg_accept_${user.id}_${guild?.id || 0}`, label: 'Accept', emoji: emojiObject(E.accept) },
            { type: 2, style: 4, custom_id: `sg_reject_${user.id}_${guild?.id || 0}`, label: 'Reject', emoji: emojiObject(E.reject) },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

function decidedCard(message, { accepted, reviewer }) {
  const card = message.components[0].toJSON();
  const keep = card.components.slice(1, -1);
  const mark = accepted ? E.accept : E.reject;
  return {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [{
      ...card,
      components: [text(`## ${mark} Feature Suggestion ${accepted ? 'Accepted' : 'Rejected'}`), ...keep, text(bullet(`${mark} __${accepted ? 'Accepted' : 'Rejected'} By :__ ${reviewer}`))],
    }],
  };
}

function decisionDM({ accepted, reviewer }) {
  const mark = accepted ? E.accept : E.reject;
  const details = [
    bullet(`__${accepted ? 'Accepted' : 'Rejected'} By :__ ${reviewer}`),
    bullet(`__At :__ <t:${Math.floor(Date.now() / 1000)}:F>`),
  ];
  const greeting = accepted
    ? '__Your feature suggestion was **accepted**. Thank you!__'
    : '__Your feature suggestion was **rejected**.__';
  return {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [{
      type: 17,
      components: [
        text(`## ${mark} Suggestion ${accepted ? 'Accepted' : 'Rejected'}\n${bullet(greeting)}`),
        ...details.flatMap((line) => [divider(), text(line)]),
      ],
      spoiler: false,
    }],
  };
}


async function openForm(interaction) {
  if (!interaction.guild) return interaction.reply(notice('__This only works inside a server__'));
  const config = await getSuggestConfig(interaction.guild.id);
  if (!config.reviewChannelId) return interaction.reply(notice('__Suggestions are not set up yet - the bot owner has to run__ `&sendsuggest`'));
  return interaction.showModal(buildSuggestModal());
}

async function submitSuggestion(interaction) {
  await (interaction.isFromMessage() ? interaction.deferUpdate() : interaction.deferReply({ flags: EPHEMERAL }));
  const reply = (payload) => interaction.followUp(payload);

  const config = await getSuggestConfig(interaction.guild.id);
  const channel = config.reviewChannelId ? await interaction.client.channels.fetch(config.reviewChannelId).catch(() => null) : null;
  if (!channel || !channel.isTextBased()) return reply(notice("__Suggestions can't be sent right now - the review channel isn't available__"));

  const title = interaction.fields.getTextInputValue(FIELDS.title).trim();
  const description = interaction.fields.getTextInputValue(FIELDS.description).trim();
  const why = interaction.fields.getTextInputValue(FIELDS.why)?.trim() || null;

  const sent = await channel.send(reviewCard({ user: interaction.user, guild: interaction.guild, title, description, why })).catch((error) => {
    console.error('Feature suggestion post failed:', error);
    return null;
  });
  if (!sent) return reply(notice("__Your suggestion couldn't be sent - please try again later__"));

  return reply(notice(['__Your suggestion was sent to the team__', '__You will get a DM when it is reviewed - keep your DMs open__']));
}

const deciding = new Set();

async function decide(interaction) {
  const [, action, userId] = interaction.customId.split('_');
  if (!userId) return interaction.reply(notice('__This suggestion is not valid__'));
  const accepted = action === 'accept';
  if (deciding.has(interaction.message.id)) return interaction.deferUpdate().catch(() => {});
  deciding.add(interaction.message.id);
  try {
    await interaction.update(decidedCard(interaction.message, { accepted, reviewer: interaction.user }));
    try {
      const user = await interaction.client.users.fetch(userId);
      await user.send(decisionDM({ accepted, reviewer: interaction.user }));
    } catch (error) {
      console.warn(`Could not DM the suggestion decision to ${userId}: ${error.message}`);
    }
  } finally {
    deciding.delete(interaction.message.id);
  }
}

async function handleSuggestInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === PANEL_BUTTON_ID) return openForm(interaction);
  if (interaction.isModalSubmit()) return submitSuggestion(interaction);
  return decide(interaction);
}

module.exports = { isSuggestInteraction, handleSuggestInteraction, buildSuggestPanel, PANEL_BUTTON_ID };
