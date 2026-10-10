'use strict';
const { ACCENT_COLOR, COMPONENTS_V2, textBlock, divider, payloadOf } = require('../../utils/render/embeds');
const { VOICEMASTER_EMOJI: E } = require('../../utils/emojis');
const { run, containerPayload } = require('./voiceControls');
const { settingsOf } = require('./tempvoice');

const EPHEMERAL = 1 << 6;
const PREFIX = 'vm:';
const RENAME_MODAL = 'vm:rename_modal';
const RENAME_FIELD = 'vm_rename_name';

const button = (action) => ({ type: 2, custom_id: `${PREFIX}${action}`, style: 2, emoji: { id: E[action].id, name: E[action].name } });
const show = (key) => `<:${E[key].name}:${E[key].id}>`;

function panelPayload(guild) {
  const usage = [
    ['lock', '`Lock` the voice channel'],
    ['unlock', '`Unlock` the voice channel'],
    ['hide', '`Ghost` the voice channel'],
    ['reveal', '`Reveal` the voice channel'],
    ['rename', '`Rename` the voice channel'],
    ['claim', '`Claim` the voice channel'],
    ['increase', '`Increase` the user limit'],
    ['decrease', '`Decrease` the user limit'],
    ['delete', '`Delete` the voice channel'],
    ['info', '`View channel information`'],
  ].map(([key, text]) => `${show(key)} — ${text}`).join('\n');
  const botName = guild.members.me?.displayName || guild.client.user.username;

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${show('title')} ${botName} Interface`),
        divider(),
        textBlock('-# Manage your voice channel by using the buttons below.'),
        divider(),
        textBlock('### Button Usage'),
        divider(),
        textBlock(`>>> ${usage}`),
        divider(),
        { type: 1, components: ['lock', 'unlock', 'hide', 'reveal', 'claim'].map(button) },
        { type: 1, components: ['info', 'increase', 'decrease', 'rename', 'delete'].map(button) },
      ],
      spoiler: false,
    }],
  };
}

const isVoiceMasterInteraction = (interaction) => (
  (interaction.isButton() && interaction.customId.startsWith(PREFIX))
  || (interaction.isModalSubmit() && interaction.customId === RENAME_MODAL)
);

const answer = (interaction, opts) => interaction.reply({ ...payloadOf(opts), flags: COMPONENTS_V2 | EPHEMERAL });

async function handleVoiceMasterInteraction(interaction) {
  const member = interaction.member;
  if (!member) return null;
  const { interfaceId } = await settingsOf(interaction.guildId);
  if (interaction.channelId !== interfaceId && member.voice.channelId !== interaction.channelId) {
    return answer(interaction, { title: 'Notice', lines: ['__You must be in this voice channel to use its panel__'] });
  }

  let action;
  let extra = {};
  if (interaction.isModalSubmit()) {
    action = 'name';
    extra = { value: interaction.fields.getTextInputValue(RENAME_FIELD) };
  } else {
    action = interaction.customId.slice(PREFIX.length);
    if (action === 'rename') {
      return interaction.showModal({
        title: 'Rename your channel',
        custom_id: RENAME_MODAL,
        components: [{
          type: 1,
          components: [{ type: 4, custom_id: RENAME_FIELD, label: 'New name', style: 1, min_length: 1, max_length: 100, required: true }],
        }],
      });
    }
    if (action === 'hide') action = 'ghost';
  }

  const result = await run(action, member, extra);
  if (result.error) return answer(interaction, { title: 'Notice', lines: [`__${result.error}__`] });
  if (result.container) return interaction.reply({ ...containerPayload(result.container), flags: COMPONENTS_V2 | EPHEMERAL, allowedMentions: { parse: [] } });
  return answer(interaction, { title: 'Voice', lines: [`__${result.text}__`] });
}

module.exports = { panelPayload, isVoiceMasterInteraction, handleVoiceMasterInteraction };
