'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setCounter, removeCounter } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');
const { updateCounter } = require('./counters');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_counter_${ID}`;
const MEMBERS_BUTTON_ID = `setup_counter_members_${ID}`;
const MEMBERS_REMOVE_ID = `setup_counter_members_remove_${ID}`;
const VOICE_BUTTON_ID = `setup_counter_voice_${ID}`;
const MODAL_ID = 'counter_members_modal';
const CHANNEL_FIELD = 'counter_members_channel';
const FORMAT_FIELD = 'counter_members_format';
const DEFAULT_FORMAT = '👥・Members : {count}';

const BUTTON_IDS = [PANEL_BUTTON_ID, MEMBERS_BUTTON_ID, MEMBERS_REMOVE_ID, VOICE_BUTTON_ID];

const isCounterSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const label = (text, description, component, required = true) => ({ type: 18, label: text, description, component: { ...component, required } });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildPanel(guild, config) {
  const members = (config.counters || {}).members;
  const membersChannel = members && guild.channels.cache.get(members.channelId);
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${SETUP_EMOJI.param} Counter` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Keep a voice channel's name updated with a live count.__  ⁘` },
        divider(),
        {
          type: 10,
          content: [
            `- __Members Counter :__ ${membersChannel ? `${membersChannel} \`${members.format}\`` : '`Not set`'}  ⁘`,
            '- __Voice Counter :__ `Not set up yet`  ⁘',
          ].join('\n'),
        },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Members Counter', custom_id: MEMBERS_BUTTON_ID },
            { type: 2, style: 4, label: 'Remove', custom_id: MEMBERS_REMOVE_ID, disabled: !members },
            { type: 2, style: 2, label: 'Voice Counter', custom_id: VOICE_BUTTON_ID },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

function buildModal(guild, members) {
  return {
    title: 'Members Counter Setup',
    custom_id: MODAL_ID,
    components: [
      label('Voice Channel', undefined, {
        type: 8,
        custom_id: CHANNEL_FIELD,
        channel_types: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
        min_values: 1,
        max_values: 1,
        default_values: members && guild.channels.cache.has(members.channelId) ? [{ type: 'channel', id: members.channelId }] : undefined,
      }),
      label('Format (use {count} as placeholder)', undefined, {
        type: 4, custom_id: FORMAT_FIELD, style: 1, value: (members && members.format) || DEFAULT_FORMAT, max_length: 100,
      }, false),
    ],
  };
}

const refresh = (interaction, guild, config) => (interaction.isFromMessage()
  ? interaction.update(buildPanel(guild, config))
  : interaction.reply({ ...buildPanel(guild, config), flags: COMPONENTS_V2 | EPHEMERAL }));

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change this__'));
  return false;
}

async function handleSubmit(interaction) {
  const channel = interaction.fields.getSelectedChannels(CHANNEL_FIELD, true, [ChannelType.GuildVoice, ChannelType.GuildStageVoice]).first();
  const format = (interaction.fields.getTextInputValue(FORMAT_FIELD) || '').trim() || DEFAULT_FORMAT;
  if (!format.includes('{count}')) return interaction.reply(notice('__The format must include `{count}`__'));

  const me = interaction.guild.members.me;
  if (!me.permissionsIn(channel).has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply(notice(`__I need the **Manage Channels** permission in__ ${channel}`));
  }

  await setCounter(interaction.guild.id, 'members', { channelId: channel.id, format });
  const config = await getGuildConfig(interaction.guild.id);
  await refresh(interaction, interaction.guild, config);
  updateCounter(interaction.guild, 'members').catch(() => {});
}

async function handleRemove(interaction) {
  await removeCounter(interaction.guild.id, 'members');
  const config = await getGuildConfig(interaction.guild.id);
  await refresh(interaction, interaction.guild, config);
}

async function handleCounterSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  if (interaction.customId === PANEL_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.reply({ ...buildPanel(interaction.guild, config), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === MEMBERS_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.showModal(buildModal(interaction.guild, (config.counters || {}).members));
  }
  if (interaction.customId === MEMBERS_REMOVE_ID) return handleRemove(interaction);
  return interaction.reply(notice('__This is not set up yet__'));
}

module.exports = { isCounterSetupInteraction, handleCounterSetupInteraction };
