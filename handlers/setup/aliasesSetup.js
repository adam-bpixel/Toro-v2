'use strict';
const { PermissionFlagsBits } = require('discord.js');
const aliases = require('../../models/settings/aliases');
const cooldown = require('../../utils/runtime/cooldown');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_aliases_${ID}`;
const ADD_BUTTON_ID = `setup_add_aliases_${ID}`;
const REMOVE_BUTTON_ID = `setup_remove_aliases_${ID}`;
const ADD_MODAL_ID = 'aliases_add_modal';
const REMOVE_MODAL_ID = 'aliases_remove_modal';
const ALIAS_FIELD_ID = 'aliases_add_alias';
const COMMAND_FIELD_ID = 'aliases_add_command';
const REMOVE_FIELD_ID = 'aliases_remove_list';

const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID];
const MODAL_IDS = [ADD_MODAL_ID, REMOVE_MODAL_ID];

const isAliasesSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildPanel(current) {
  const entries = Object.entries(current).sort(([a], [b]) => a.localeCompare(b));
  const list = entries.length ? entries.map(([alias, command]) => `- __\`${alias}\` → \`${command}\`__  ⁘`).join('\n') : '- __No aliases configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${SETUP_EMOJI.param} Aliases` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Configure command aliases. Use the buttons below to add or remove aliases__  ⁘` },
        divider(),
        { type: 10, content: `- __Current Aliases ${entries.length} :__  ⁘\n${list}` },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Aliases Add', custom_id: ADD_BUTTON_ID },
            { type: 2, style: 2, label: 'Aliases Remove', custom_id: REMOVE_BUTTON_ID, disabled: entries.length === 0 },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

const buildAddModal = () => ({
  title: 'Add Alias',
  custom_id: ADD_MODAL_ID,
  components: [
    label('Alias', '1-20 letters, numbers, - or _', { type: 4, custom_id: ALIAS_FIELD_ID, style: 1, min_length: 1, max_length: 20, placeholder: 'e.g. p', required: true }),
    label('Command', 'The real command it should run', { type: 4, custom_id: COMMAND_FIELD_ID, style: 1, min_length: 1, max_length: 32, placeholder: 'e.g. profile', required: true }),
  ],
});

const buildRemoveModal = (current) => ({
  title: 'Remove Aliases',
  custom_id: REMOVE_MODAL_ID,
  components: [
    label('Aliases to remove', 'Select the aliases you want to remove', {
      type: 3,
      custom_id: REMOVE_FIELD_ID,
      placeholder: 'Select aliases',
      min_values: 1,
      max_values: Object.keys(current).length,
      options: Object.entries(current).map(([alias, command]) => ({ label: alias, value: alias, description: `Runs \`${command}\`` })),
    }),
  ],
});

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change server aliases__'));
  return false;
}

const refreshPanel = (interaction, current) =>
  interaction.isFromMessage()
    ? interaction.update(buildPanel(current))
    : interaction.reply({ ...buildPanel(current), flags: COMPONENTS_V2 | EPHEMERAL });

async function handleAdd(interaction) {
  const cooldownKey = `aliases:guild:${interaction.guild.id}`;
  const wait = cooldown.peek(cooldownKey, aliases.COOLDOWN_MS);
  if (wait.onCooldown) return interaction.reply(notice(`__Please wait ${Math.ceil(wait.remainingMs / 1000)}s before changing the aliases again__`));

  const alias = interaction.fields.getTextInputValue(ALIAS_FIELD_ID).trim();
  const command = interaction.fields.getTextInputValue(COMMAND_FIELD_ID).trim();
  const result = await aliases.add('guild', interaction.guild.id, alias, command, interaction.client);
  if (result.error) return interaction.reply(notice(`__${result.error}__`));
  cooldown.start(cooldownKey);

  const current = await aliases.list('guild', interaction.guild.id);
  await refreshPanel(interaction, current);
}

async function handleRemove(interaction) {
  const cooldownKey = `aliases:guild:${interaction.guild.id}`;
  const wait = cooldown.peek(cooldownKey, aliases.COOLDOWN_MS);
  if (wait.onCooldown) return interaction.reply(notice(`__Please wait ${Math.ceil(wait.remainingMs / 1000)}s before changing the aliases again__`));

  const toRemove = interaction.fields.getStringSelectValues(REMOVE_FIELD_ID);
  for (const alias of toRemove) await aliases.remove('guild', interaction.guild.id, alias);
  cooldown.start(cooldownKey);

  const current = await aliases.list('guild', interaction.guild.id);
  await refreshPanel(interaction, current);
}

async function handleAliasesSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) {
    return interaction.customId === ADD_MODAL_ID ? handleAdd(interaction) : handleRemove(interaction);
  }

  const current = await aliases.list('guild', interaction.guild.id);
  if (interaction.customId === PANEL_BUTTON_ID) {
    return interaction.reply({ ...buildPanel(current), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === ADD_BUTTON_ID) {
    return interaction.showModal(buildAddModal());
  }
  if (!Object.keys(current).length) return interaction.reply(notice('__There are no aliases to remove__'));
  return interaction.showModal(buildRemoveModal(current));
}

module.exports = { isAliasesSetupInteraction, handleAliasesSetupInteraction };
