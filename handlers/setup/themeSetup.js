'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { themeOf, saveTheme, parseColor, toHex } = require('../../models/settings/theme');
const { serverAllowed } = require('../../models/economy/premium');

const EPHEMERAL = 1 << 6;
const PANEL_BUTTON_ID = 'setup_theme_1398395532103254157';
const MODAL_ID = 'setup_theme_modal';
const COLOR_FIELD = 'setup_theme_color';

const isThemeSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && interaction.customId === PANEL_BUTTON_ID) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const buildModal = (current) => ({
  title: 'Theme Setup',
  custom_id: MODAL_ID,
  components: [
    label('Color', `Current : ${toHex(current)} - or type "reset" for the default`, {
      type: 4, custom_id: COLOR_FIELD, style: 1, placeholder: '#RRGGBB, RRGGBB, 0xRRGGBB or a decimal number', max_length: 10, required: true,
    }),
  ],
});

async function handleSubmit(interaction) {
  const raw = interaction.fields.getTextInputValue(COLOR_FIELD).trim();
  const current = themeOf(interaction.guild.id);

  if (raw.toLowerCase() === 'reset') {
    if (current === null) return interaction.reply(notice('__The server has no theme to reset__'));
    await saveTheme(interaction.guild.id, null);
    return interaction.reply(notice('__Theme reset to the default color__', 'Server Theme'));
  }

  const color = parseColor(raw);
  if (color === null) return interaction.reply(notice('__Invalid color. Use #RRGGBB, RRGGBB, 0xRRGGBB or a decimal number__'));
  if (color === current) return interaction.reply(notice(`__The theme is already ${toHex(color)}__`));

  await saveTheme(interaction.guild.id, color);
  return interaction.reply(notice(`__Theme color changed to__ ${toHex(color)}`, 'Server Theme'));
}

async function handleThemeSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change this__'));
  }
  if (!(await serverAllowed({ guild: interaction.guild }))) {
    return interaction.reply(notice('__Theme requires an **active Premium subscription** for this server__'));
  }

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  return interaction.showModal(buildModal(themeOf(interaction.guild.id) ?? ACCENT_COLOR));
}

module.exports = { isThemeSetupInteraction, handleThemeSetupInteraction };
