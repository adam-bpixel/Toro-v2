'use strict';
const { PermissionFlagsBits } = require('discord.js');
const autoreply = require('../../models/settings/autoreply');
const { container, textBlock, divider, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const HEADER_EMOJI = '<:2885discordmessagerequestswhite:1551750335066804275>';
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_autoreply_${ID}`;
const ADD_BUTTON_ID = `setup_add_autoreply_${ID}`;
const REMOVE_BUTTON_ID = `setup_remove_autoreply_${ID}`;
const ADD_MODAL_ID = 'autoreply_add_modal';
const REMOVE_MODAL_ID = 'autoreply_remove_modal';
const TRIGGER_FIELD_ID = 'autoreply_trigger';
const RESPONSE_FIELD_ID = 'autoreply_response';
const REMOVE_FIELD_ID = 'autoreply_remove_triggers';
const SHOWN = 15;

const isAutoreplyInteraction = (interaction) =>
  (interaction.isMessageComponent() && [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID].includes(interaction.customId)) ||
  (interaction.isModalSubmit() && [ADD_MODAL_ID, REMOVE_MODAL_ID].includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});
const short = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

function buildPanel(guild, list) {
  const banner = guild.bannerURL({ size: 1024 });
  const lines = list.length
    ? [...list.slice(0, SHOWN).map((r) => `- \`${short(r.trigger, 40)}\` → ${short(r.response.replace(/\s+/g, ' '), 60)}  ⁘`), ...(list.length > SHOWN ? [`- __...and ${list.length - SHOWN} more__  ⁘`] : [])].join('\n')
    : '- __No auto replies configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        ...(banner ? [{ type: 12, items: [{ media: { url: banner }, description: `${guild.name} Auto Reply`, spoiler: false }] }, divider()] : []),
        textBlock(`## ${HEADER_EMOJI} Auto Reply`),
        divider(),
        textBlock(`- ${SETUP_EMOJI.dropdown} __Configure Auto Reply settings. Bot will automatically respond to specific messages.__  ⁘`),
        divider(),
        textBlock(`- __Current Auto Replies ${list.length} :__  ⁘\n${lines}`),
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Auto Reply Add', custom_id: ADD_BUTTON_ID, disabled: list.length >= autoreply.MAX_PER_GUILD },
            { type: 2, style: 2, label: 'Auto Reply Remove', custom_id: REMOVE_BUTTON_ID, disabled: list.length === 0 },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

const buildAddModal = () => ({
  title: 'Add Auto Reply',
  custom_id: ADD_MODAL_ID,
  components: [
    label('Trigger', 'The word or phrase to react to', { type: 4, custom_id: TRIGGER_FIELD_ID, style: 1, required: true, max_length: 100, placeholder: 'e.g. hello' }),
    label('Reply', 'What the bot answers', { type: 4, custom_id: RESPONSE_FIELD_ID, style: 2, required: true, max_length: 1000, placeholder: 'e.g. Hello, welcome!' }),
  ],
});

const buildRemoveModal = (list) => ({
  title: 'Remove Auto Replies',
  custom_id: REMOVE_MODAL_ID,
  components: [
    label('Triggers to remove', 'Select the auto replies you want to remove', {
      type: 3,
      custom_id: REMOVE_FIELD_ID,
      placeholder: 'Select triggers',
      min_values: 1,
      max_values: Math.min(list.length, 25),
      options: list.slice(0, 25).map((r) => ({ label: short(r.trigger, 100), value: r.trigger.slice(0, 100), description: short(r.response.replace(/\s+/g, ' '), 100) })),
    }),
  ],
});

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change auto replies__'));
  return false;
}

const refresh = (interaction, panel) => (interaction.isFromMessage()
  ? interaction.update(panel)
  : interaction.reply({ ...panel, flags: COMPONENTS_V2 | EPHEMERAL }));

async function handleAutoreplyInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;
  const { guild } = interaction;

  if (interaction.isModalSubmit()) {
    if (interaction.customId === ADD_MODAL_ID) {
      const trigger = interaction.fields.getTextInputValue(TRIGGER_FIELD_ID).trim();
      const response = interaction.fields.getTextInputValue(RESPONSE_FIELD_ID).trim();
      if (!trigger || !response) return interaction.reply(notice('__The trigger and the reply can\'t be empty__'));
      const result = await autoreply.add(guild.id, trigger, response);
      if (result.error) return interaction.reply(notice(`__${result.error}__`));
    } else {
      for (const trigger of interaction.fields.getStringSelectValues(REMOVE_FIELD_ID)) await autoreply.remove(guild.id, trigger);
    }
    return refresh(interaction, buildPanel(guild, await autoreply.list(guild.id)));
  }

  const list = await autoreply.list(guild.id);
  if (interaction.customId === PANEL_BUTTON_ID) return interaction.reply({ ...buildPanel(guild, list), flags: COMPONENTS_V2 | EPHEMERAL });
  if (interaction.customId === ADD_BUTTON_ID) {
    if (list.length >= autoreply.MAX_PER_GUILD) return interaction.reply(notice(`__You already have ${list.length}/${autoreply.MAX_PER_GUILD} auto replies - remove one first__`));
    return interaction.showModal(buildAddModal());
  }
  if (!list.length) return interaction.reply(notice('__There are no auto replies to remove__'));
  return interaction.showModal(buildRemoveModal(list));
}

module.exports = { isAutoreplyInteraction, handleAutoreplyInteraction, buildPanel, PANEL_BUTTON_ID };
