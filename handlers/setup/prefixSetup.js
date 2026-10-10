'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { prefixesFor, savePrefix } = require('../../models/settings/prefix');
const { container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_prefix_${ID}`;
const MODAL_ID = 'setup_prefix_modal';
const PREFIX_FIELD = 'setup_prefix_value';
const MAX_PREFIX_LENGTH = 5;
const COOLDOWN_MS = 30_000;

const isPrefixSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && interaction.customId === PANEL_BUTTON_ID) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const buildModal = (current) => ({
  title: 'Prefix Setup',
  custom_id: MODAL_ID,
  components: [
    label('New Prefix', `Current : ${current}`, {
      type: 4, custom_id: PREFIX_FIELD, style: 1, value: current, max_length: MAX_PREFIX_LENGTH, required: true,
    }),
  ],
});

const isBadPrefix = (text) => !text || /\s/.test(text) || text.includes('`') || [...text].length > MAX_PREFIX_LENGTH;

async function handleSubmit(interaction) {
  const next = interaction.fields.getTextInputValue(PREFIX_FIELD).trim();
  if (isBadPrefix(next)) {
    return interaction.reply(notice(`__The prefix must be 1 to ${MAX_PREFIX_LENGTH} characters, without spaces or backticks__`));
  }
  const { server: current } = await prefixesFor(interaction.guild.id, interaction.user.id);
  if (next === current) return interaction.reply(notice('__That is already the server prefix__'));

  const wait = hit(`prefix:${interaction.guild.id}`, COOLDOWN_MS);
  if (wait.onCooldown) {
    const seconds = Math.ceil(wait.remainingMs / 1000);
    return interaction.reply(notice(`__Please wait ${seconds} second${seconds === 1 ? '' : 's'} before changing the prefix again__`));
  }

  await savePrefix(interaction.guild.id, next);
  return interaction.reply(notice(`__Server prefix changed to__ \`${next}\``, 'Prefix'));
}

async function handlePrefixSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change this__'));
  }

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  const { server: current } = await prefixesFor(interaction.guild.id, interaction.user.id);
  return interaction.showModal(buildModal(current));
}

module.exports = { isPrefixSetupInteraction, handlePrefixSetupInteraction };
