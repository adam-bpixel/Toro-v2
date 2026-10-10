'use strict';
const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildConfig, setClearSkipChannels } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const MAX_SKIP_CHANNELS = 25;
const CLEARABLE = new Set([ChannelType.GuildText, ChannelType.GuildAnnouncement]);
const PANEL_BUTTON_ID = 'setup_clearsetup_1398395532103254157';
const ADD_BUTTON_ID = 'setup_add_clearsetup_1398395532103254157';
const REMOVE_BUTTON_ID = 'setup_remove_clearsetup_1398395532103254157';
const ADD_MODAL_ID = 'clearsetup_add_modal';
const REMOVE_MODAL_ID = 'clearsetup_remove_modal';
const ADD_FIELD_ID = 'clearsetup_add_channels';
const REMOVE_FIELD_ID = 'clearsetup_remove_channels';

const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID];
const MODAL_IDS = [ADD_MODAL_ID, REMOVE_MODAL_ID];

const isClearSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const savedIds = (config) => (Array.isArray(config.clearSkipChannelIds) ? config.clearSkipChannelIds : []);

function buildPanel(ids) {
  const list = ids.length ? ids.map((id) => `- <#${id}>  ⁘`).join('\n') : '- __No skip channels configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 10, content: `## ${SETUP_EMOJI.param} Clear Skip` },
          divider(),
          {
            type: 10,
            content: `- ${SETUP_EMOJI.dropdown} __Configure channels to skip when using clear command (max ${MAX_SKIP_CHANNELS}).__  ⁘`,
          },
          divider(),
          { type: 10, content: `- __Current Skip Channels ${ids.length}/${MAX_SKIP_CHANNELS} :__  ⁘\n${list}` },
          divider(),
          {
            type: 1,
            components: [
              { type: 2, style: 2, label: 'Clear Skip Add', custom_id: ADD_BUTTON_ID, disabled: ids.length >= MAX_SKIP_CHANNELS },
              { type: 2, style: 2, label: 'Clear Skip Remove', custom_id: REMOVE_BUTTON_ID, disabled: ids.length === 0 },
            ],
          },
        ],
        spoiler: false,
      },
    ],
  };
}

function buildAddModal(remaining) {
  return {
    title: 'Add Clear Skip Channels',
    custom_id: ADD_MODAL_ID,
    components: [
      label('Channels or Categories', 'Pick channels to skip, or a category to skip every channel inside it', {
        type: 8, custom_id: ADD_FIELD_ID, placeholder: 'Select channels or categories', min_values: 1, max_values: remaining,
      }),
    ],
  };
}

function buildRemoveModal(guild, ids) {
  const options = ids.map((id) => {
    const channel = guild.channels.cache.get(id);
    return channel
      ? { label: `#${channel.name}`.slice(0, 100), value: id }
      : { label: 'Deleted channel', value: id, description: `ID: ${id}` };
  });
  return {
    title: 'Remove Clear Skip Channels',
    custom_id: REMOVE_MODAL_ID,
    components: [
      label('Channels to remove', 'Select the channels you want to stop skipping', {
        type: 3, custom_id: REMOVE_FIELD_ID, placeholder: 'Select channels', min_values: 1, max_values: options.length, options,
      }),
    ],
  };
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change this__'));
  return false;
}

function channelsOf(guild, picked) {
  if (picked.type !== ChannelType.GuildCategory) {
    const channel = guild.channels.cache.get(picked.id);
    return channel ? [channel] : [];
  }
  return [...guild.channels.cache.filter((c) => c.parentId === picked.id && CLEARABLE.has(c.type)).values()];
}

function refreshPanel(interaction, ids) {
  return interaction.isFromMessage()
    ? interaction.update(buildPanel(ids))
    : interaction.reply({ ...buildPanel(ids), flags: COMPONENTS_V2 | EPHEMERAL });
}

async function handleAdd(interaction, ids) {
  const picked = [...interaction.fields.getSelectedChannels(ADD_FIELD_ID, true).values()];
  const added = [];
  const skipped = [];
  for (const item of picked) {
    const channels = channelsOf(interaction.guild, item);
    if (!channels.length) { skipped.push({ channel: item, reason: 'no text channels inside' }); continue; }
    for (const channel of channels) {
      if (ids.includes(channel.id) || added.some((c) => c.id === channel.id)) { skipped.push({ channel, reason: 'already added' }); continue; }
      if (ids.length + added.length >= MAX_SKIP_CHANNELS) { skipped.push({ channel, reason: `limit of ${MAX_SKIP_CHANNELS} reached` }); continue; }
      added.push(channel);
    }
  }

  const next = [...ids, ...added.map((c) => c.id)];
  if (added.length) await setClearSkipChannels(interaction.guild.id, next);
  await refreshPanel(interaction, next);
  if (skipped.length) {
    await interaction.followUp(notice(skipped.flatMap(({ channel, reason }) => [`__Skipped__ : ${channel}`, `__Reason__ : ${reason}`])));
  }
}

async function handleRemove(interaction, ids) {
  const toRemove = interaction.fields.getStringSelectValues(REMOVE_FIELD_ID);
  const next = ids.filter((id) => !toRemove.includes(id));
  await setClearSkipChannels(interaction.guild.id, next);
  await refreshPanel(interaction, next);
}

async function handleClearSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  const ids = savedIds(await getGuildConfig(interaction.guild.id));

  if (interaction.isModalSubmit()) {
    return interaction.customId === ADD_MODAL_ID ? handleAdd(interaction, ids) : handleRemove(interaction, ids);
  }

  if (interaction.customId === PANEL_BUTTON_ID) {
    return interaction.reply({ ...buildPanel(ids), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === ADD_BUTTON_ID) {
    const remaining = MAX_SKIP_CHANNELS - ids.length;
    if (remaining <= 0) return interaction.reply(notice(`__You already have ${MAX_SKIP_CHANNELS}/${MAX_SKIP_CHANNELS} skip channels - remove one first__`));
    return interaction.showModal(buildAddModal(remaining));
  }
  if (!ids.length) return interaction.reply(notice('__There are no skip channels to remove__'));
  return interaction.showModal(buildRemoveModal(interaction.guild, ids));
}

module.exports = { isClearSetupInteraction, handleClearSetupInteraction };
