'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, getCommandRestriction, setCommandRestriction } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_command_${ID}`;
const MANAGE_BUTTON_ID = `setup_command_manage_${ID}`;
const MODAL_ID = `command_manage_modal_${ID}`;
const ACTION_FIELD = 'command_action';
const NAME_FIELD = 'command_name';
const UNRESTRICTABLE = new Set(['setup', 'command']);

const BUTTON_IDS = [PANEL_BUTTON_ID, MANAGE_BUTTON_ID];
const MODAL_IDS = [MODAL_ID];

const isCommandManageInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component, required = true) => ({ type: 18, label: text, description, component: { ...component, required } });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function restrictionLines(restrictions) {
  const entries = Object.entries(restrictions || {})
    .filter(([, r]) => r.disabledGlobally || (r.disabledChannelIds || []).length || (r.allowedChannelIds || []).length)
    .sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return '- __No commands are disabled__  ⁘';
  return entries.map(([name, r]) => {
    const parts = [];
    if (r.disabledGlobally) parts.push('disabled server-wide');
    if ((r.disabledChannelIds || []).length) parts.push(`disabled in ${r.disabledChannelIds.map((id) => `<#${id}>`).join(' ')}`);
    if ((r.allowedChannelIds || []).length) parts.push(`allowed in ${r.allowedChannelIds.map((id) => `<#${id}>`).join(' ')}`);
    return `- __\`${name}\` : ${parts.join(', ')}__  ⁘`;
  }).join('\n');
}

function buildPanel(restrictions) {
  const entries = Object.entries(restrictions || {})
    .filter(([, r]) => r.disabledGlobally || (r.disabledChannelIds || []).length || (r.allowedChannelIds || []).length);
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${SETUP_EMOJI.param} Manage` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Enable or disable commands server-wide.__  ⁘` },
        divider(),
        { type: 10, content: `- __Disabled Commands ${entries.length} :__  ⁘\n${restrictionLines(restrictions)}` },
        divider(),
        { type: 1, components: [{ type: 2, style: 2, label: 'Manage', custom_id: MANAGE_BUTTON_ID }] },
      ],
      spoiler: false,
    }],
  };
}

const buildModal = () => ({
  title: 'Manage Command',
  custom_id: MODAL_ID,
  components: [
    label('Action', undefined, {
      type: 3,
      custom_id: ACTION_FIELD,
      placeholder: 'Select action',
      min_values: 1,
      max_values: 1,
      options: [
        { label: 'Disable', value: 'disable', description: 'Turn a command off server-wide' },
        { label: 'Enable', value: 'enable', description: 'Turn a command back on server-wide' },
      ],
    }),
    label('Command Name', undefined, { type: 4, custom_id: NAME_FIELD, style: 1, placeholder: 'e.g., help, ping', max_length: 32 }),
  ],
});

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change this__'));
  return false;
}

const refreshPanel = (interaction, restrictions) => (interaction.isFromMessage()
  ? interaction.update(buildPanel(restrictions))
  : interaction.reply({ ...buildPanel(restrictions), flags: COMPONENTS_V2 | EPHEMERAL }));

async function handleSubmit(interaction) {
  const action = interaction.fields.getStringSelectValues(ACTION_FIELD)[0];
  const name = interaction.fields.getTextInputValue(NAME_FIELD).trim().toLowerCase();
  const command = interaction.client.commands.get(name) || interaction.client.commands.get(interaction.client.aliases.get(name));
  if (!command) return interaction.reply(notice(`__Couldn't find a command called__ \`${name}\``));
  if (UNRESTRICTABLE.has(command.name)) return interaction.reply(notice(`__\`${command.name}\` can't be restricted__`));

  const restriction = await getCommandRestriction(interaction.guild.id, command.name);
  if (action === 'disable') {
    restriction.disabledGlobally = true;
  } else {
    restriction.disabledGlobally = false;
    restriction.disabledChannelIds = [];
    restriction.allowedChannelIds = [];
  }
  await setCommandRestriction(interaction.guild.id, command.name, restriction);

  const config = await getGuildConfig(interaction.guild.id);
  await refreshPanel(interaction, config.commandRestrictions || {});
}

async function handleCommandManageInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  if (interaction.customId === PANEL_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.reply({ ...buildPanel(config.commandRestrictions || {}), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  return interaction.showModal(buildModal());
}

module.exports = { isCommandManageInteraction, handleCommandManageInteraction };
