'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { buildPayload, contextOf } = require('../../utils/runtime/replay');
const { container, COMPONENTS_V2, divider, textBlock } = require('../../utils/render/embeds');
const { getGuildConfig, setLogChannel, setLogEnabled } = require('../../models/core/moderation');
const { CATEGORIES, categoryOf, forgetGuild } = require('./logs');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_logs_button_${ID}`;
const CREATE_SELECT_ID = `setup_logs_select_category_${ID}`;
const VIEW_SELECT_ID = `setup_logs_view_config_${ID}`;
const MODAL_PREFIX = 'logs_modal_';
const TOGGLE_PREFIX = `setup_logs_select_toggle_${ID}_`;
const TYPES_FIELD = 'logs_types';
const CHANNEL_FIELD = 'logs_channel';

const isLogsSetupInteraction = (interaction) => (
  interaction.isMessageComponent() && (
    [PANEL_BUTTON_ID, CREATE_SELECT_ID, VIEW_SELECT_ID].includes(interaction.customId) || interaction.customId.startsWith(TOGGLE_PREFIX)
  )
) || (interaction.isModalSubmit() && interaction.customId.startsWith(MODAL_PREFIX));

const notice = (lines) => ({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title: 'Notice', lines: [].concat(lines) })] });
const emojiOf = ({ name, id }) => `<:${name}:${id}>`;
const label = (text, component) => ({ type: 18, label: text, component });

function buildModal(category) {
  return {
    title: `Configure ${category.label}`,
    custom_id: `${MODAL_PREFIX}${category.key}`,
    components: [
      label('Select Log Types', {
        type: 3, custom_id: TYPES_FIELD, placeholder: 'Choose log event types', min_values: 1, max_values: category.events.length,
        options: category.events.map((event) => ({ label: event.label, value: event.key })),
      }),
      label('Select Channel', {
        type: 8, custom_id: CHANNEL_FIELD, placeholder: 'Choose log channel', min_values: 1, max_values: 1,
        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      }),
    ],
  };
}

const row = (component) => ({ type: 1, components: [component] });
const byLabel = (events) => [...events].sort((x, y) => x.label.localeCompare(y.label));

function configCard(guild, category, config) {
  const saved = config.logChannels || {};
  const off = config.logDisabled || {};
  const events = byLabel(category.events);
  const lines = events.map((event) => `- \`${event.label}\` → ${saved[event.key] ? `<#${saved[event.key]}> | ${off[event.key] ? 'Disabled' : 'Enabled'}` : 'None'}  ⁘`).join('\n');
  const options = events.map((event) => ({
    value: event.key, label: event.label,
    description: saved[event.key] ? `${off[event.key] ? 'Disabled' : 'Enabled'} | Channel: ${guild.channels.cache.get(saved[event.key])?.name || 'deleted'}` : 'Not configured',
  }));
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17, accent_color: 13944790, spoiler: false,
      components: [
        textBlock(`## ${category.key.replace(/_/g, ' ')} Configuration`), divider(), textBlock(lines), divider(),
        row({ type: 3, placeholder: 'Select log to enable/disable', options, min_values: 1, max_values: 1, custom_id: `${TOGGLE_PREFIX}${category.key}` }), divider(),
        row({
          type: 3, placeholder: 'Select log category to show config', min_values: 1, max_values: 1, custom_id: VIEW_SELECT_ID,
          options: CATEGORIES.map((c) => ({ value: c.key, label: c.label, emoji: c.emoji, description: `View all ${c.key.replace(/_events$/, '').replace(/_/g, ' ')} event logs` })),
        }),
      ],
    }],
  };
}

const isConfigCard = (message) => JSON.stringify(message.components.map((c) => c.toJSON())).includes(TOGGLE_PREFIX);

async function handleLogsSetupInteraction(interaction, commands) {
  if (!interaction.inGuild()) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to set up logs__'));
  }
  const { customId, guild } = interaction;
  const config = () => getGuildConfig(guild.id);

  const panel = async () => {
    const snap = commands.get('setup').recorded.flow.transitions.find((t) => t.custom_id === PANEL_BUTTON_ID).reply[0];
    const payload = buildPayload(snap, await contextOf(interaction), { interactive: true });
    return { ...payload, flags: (payload.flags || 0) | EPHEMERAL };
  };

  if (customId === PANEL_BUTTON_ID) return interaction.reply(await panel());

  if (customId === CREATE_SELECT_ID) {
    const category = categoryOf(interaction.values[0]);
    return category ? interaction.showModal(buildModal(category)) : interaction.deferUpdate();
  }

  if (customId === VIEW_SELECT_ID) {
    const category = categoryOf(interaction.values[0]);
    if (!category) return interaction.deferUpdate();
    const card = configCard(guild, category, await config());
    return isConfigCard(interaction.message) ? interaction.update(card) : interaction.reply({ ...card, flags: card.flags | EPHEMERAL });
  }

  if (customId.startsWith(TOGGLE_PREFIX)) {
    const category = categoryOf(customId.slice(TOGGLE_PREFIX.length));
    const event = category?.events.find((e) => e.key === interaction.values[0]);
    if (!event) return interaction.deferUpdate();
    const current = await config();
    if (!(current.logChannels || {})[event.key]) {
      return interaction.reply(notice(`__${event.label} has no channel yet__ - __set one from the "Select log event category" menu__`));
    }
    await setLogEnabled(guild.id, event.key, Boolean((current.logDisabled || {})[event.key]));
    forgetGuild(guild.id);
    return interaction.update(configCard(guild, category, await config()));
  }

  const category = categoryOf(customId.slice(MODAL_PREFIX.length));
  const channel = interaction.fields.getSelectedChannels(CHANNEL_FIELD, true).first();
  const keys = interaction.fields.getStringSelectValues(TYPES_FIELD).filter((key) => category?.events.some((event) => event.key === key));
  if (!category || !channel || !keys.length) return interaction.deferUpdate();

  const me = channel.permissionsFor(guild.members.me);
  if (!me?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    return interaction.reply(notice(`__I can't send messages in__ ${channel} - __give me View Channel and Send Messages there__`));
  }
  const fromMessage = interaction.isFromMessage();
  if (fromMessage) await interaction.deferUpdate();
  await Promise.all(keys.map((key) => setLogChannel(guild.id, key, channel.id)));
  forgetGuild(guild.id);

  const names = keys.map((key) => category.events.find((event) => event.key === key).label);
  const confirmation = notice([`__${category.label} saved__`, `__Events__ : ${names.join(', ')}`, `__Channel__ : ${channel}`]);
  if (fromMessage) await interaction.editReply(await panel());
  return fromMessage ? interaction.followUp(confirmation) : interaction.reply(confirmation);
}

module.exports = { isLogsSetupInteraction, handleLogsSetupInteraction };
