'use strict';
const { PermissionFlagsBits } = require('discord.js');
const noprefix = require('../../models/enforcement/noprefix');
const { container, textBlock, divider, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_noprefix_${ID}`;
const ADD_BUTTON_ID = `setup_add_noprefix_${ID}`;
const REMOVE_BUTTON_ID = `setup_remove_noprefix_${ID}`;
const ADD_MODAL_ID = 'noprefix_add_modal';
const REMOVE_MODAL_ID = 'noprefix_remove_modal';
const ADD_FIELD_ID = 'noprefix_command';
const REMOVE_FIELD_ID = 'noprefix_remove_commands';
const LIMIT = noprefix.LIMITS.server;

const isNoPrefixSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID].includes(interaction.customId))
  || (interaction.isModalSubmit() && [ADD_MODAL_ID, REMOVE_MODAL_ID].includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildPanel(names) {
  const list = names.length ? names.map((name) => `- \`${name}\`  ⁘`).join('\n') : '- __No commands configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${SETUP_EMOJI.param} No Prefix`),
        divider(),
        textBlock(`- ${SETUP_EMOJI.dropdown} __Commands everyone in this server can run without typing the prefix (max ${LIMIT}).__  ⁘\n- ${SETUP_EMOJI.dropdown} __Only for you: \`&noprefix self add <command>\`__  ⁘`),
        divider(),
        textBlock(`- __Current Commands ${names.length}/${LIMIT} :__  ⁘\n${list}`),
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'No Prefix Add', custom_id: ADD_BUTTON_ID, disabled: names.length >= LIMIT },
            { type: 2, style: 2, label: 'No Prefix Remove', custom_id: REMOVE_BUTTON_ID, disabled: names.length === 0 },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

const buildAddModal = () => ({
  title: 'Add a No Prefix Command',
  custom_id: ADD_MODAL_ID,
  components: [
    label('Command', 'The command (or one of its aliases) to run without the prefix', {
      type: 4, custom_id: ADD_FIELD_ID, style: 1, placeholder: 'daily', min_length: 1, max_length: 40, required: true,
    }),
  ],
});

const buildRemoveModal = (names) => ({
  title: 'Remove No Prefix Commands',
  custom_id: REMOVE_MODAL_ID,
  components: [
    label('Commands to remove', 'They need the prefix again', {
      type: 3, custom_id: REMOVE_FIELD_ID, placeholder: 'Select commands', min_values: 1, max_values: Math.min(names.length, 25),
      options: names.slice(0, 25).map((name) => ({ label: name, value: name })),
    }),
  ],
});

const refresh = (interaction, names) => (interaction.isFromMessage()
  ? interaction.update(buildPanel(names))
  : interaction.reply({ ...buildPanel(names), flags: COMPONENTS_V2 | EPHEMERAL }));

async function handleNoPrefixSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change the no prefix commands__'));
  }
  const guildId = interaction.guild.id;
  const names = await noprefix.serverNames(guildId);

  if (interaction.isModalSubmit()) {
    if (interaction.customId === ADD_MODAL_ID) {
      const result = await noprefix.addServerCommand(interaction.client, guildId, interaction.fields.getTextInputValue(ADD_FIELD_ID));
      if (result.error) return interaction.reply(notice(`__${result.error}__`));
    } else {
      await noprefix.removeServerCommands(guildId, interaction.fields.getStringSelectValues(REMOVE_FIELD_ID));
    }
    return refresh(interaction, await noprefix.serverNames(guildId));
  }

  if (interaction.customId === PANEL_BUTTON_ID) return interaction.reply({ ...buildPanel(names), flags: COMPONENTS_V2 | EPHEMERAL });
  if (interaction.customId === ADD_BUTTON_ID) {
    if (names.length >= LIMIT) return interaction.reply(notice(`__You already have ${LIMIT}/${LIMIT} commands - remove one first__`));
    return interaction.showModal(buildAddModal());
  }
  if (!names.length) return interaction.reply(notice('__There are no commands to remove__'));
  return interaction.showModal(buildRemoveModal(names));
}

module.exports = { isNoPrefixSetupInteraction, handleNoPrefixSetupInteraction };
