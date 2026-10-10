'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setAzkarConfig, removeAzkarConfig } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');
const { triggerAzkarNow, cancelAzkar } = require('./azkar');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_azkar_${ID}`;
const CONFIGURE_BUTTON_ID = `setup_azkar_configure_${ID}`;
const REMOVE_BUTTON_ID = `setup_azkar_remove_${ID}`;
const MODAL_ID = 'setup_azkar_modal';
const CHANNEL_FIELD = 'setup_azkar_channel';
const INTERVAL_FIELD = 'setup_azkar_interval';
const INTERVALS = ['5h', '12h', '24h', '48h'];

const BUTTON_IDS = [PANEL_BUTTON_ID, CONFIGURE_BUTTON_ID, REMOVE_BUTTON_ID];

const isAzkarSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const label = (text, description, component, required = true) => ({ type: 18, label: text, description, component: { ...component, required } });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildPanel(guild, settings) {
  const channel = settings && guild.channels.cache.get(settings.channelId);
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${SETUP_EMOJI.param} Azkar` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Posts a random Azkar reminder to a channel on a repeating interval.__  ⁘` },
        divider(),
        {
          type: 10,
          content: [
            `- __Channel :__ ${channel ? `${channel}` : '`Not set`'}  ⁘`,
            `- __Interval :__ ${settings ? `\`${settings.intervalHours}h\`` : '`Not set`'}  ⁘`,
          ].join('\n'),
        },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Configure', custom_id: CONFIGURE_BUTTON_ID },
            { type: 2, style: 4, label: 'Remove', custom_id: REMOVE_BUTTON_ID, disabled: !settings },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

function buildModal(settings) {
  return {
    title: 'Azkar Setup',
    custom_id: MODAL_ID,
    components: [
      label('Channel', undefined, {
        type: 8,
        custom_id: CHANNEL_FIELD,
        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        min_values: 1,
        max_values: 1,
        default_values: settings && settings.channelId ? [{ type: 'channel', id: settings.channelId }] : undefined,
      }),
      label('Interval', undefined, {
        type: 3,
        custom_id: INTERVAL_FIELD,
        min_values: 1,
        max_values: 1,
        options: INTERVALS.map((value) => ({ label: value, value, default: Boolean(settings && `${settings.intervalHours}h` === value) })),
      }),
    ],
  };
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change this__'));
  return false;
}

const refresh = (interaction, guild, settings) => (interaction.isFromMessage()
  ? interaction.update(buildPanel(guild, settings))
  : interaction.reply({ ...buildPanel(guild, settings), flags: COMPONENTS_V2 | EPHEMERAL }));

async function handleSubmit(interaction) {
  const channel = interaction.fields.getSelectedChannels(CHANNEL_FIELD, true, [ChannelType.GuildText, ChannelType.GuildAnnouncement]).first();
  const intervalHours = Number(interaction.fields.getStringSelectValues(INTERVAL_FIELD)[0].replace('h', ''));

  const me = interaction.guild.members.me;
  if (!me.permissionsIn(channel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    return interaction.reply(notice(`__I can't send messages in__ ${channel}`));
  }

  await setAzkarConfig(interaction.guild.id, { channelId: channel.id, intervalHours });
  triggerAzkarNow(interaction.client, interaction.guild.id).catch(() => {});

  const config = await getGuildConfig(interaction.guild.id);
  await refresh(interaction, interaction.guild, config.azkar);
}

async function handleRemove(interaction) {
  await removeAzkarConfig(interaction.guild.id);
  cancelAzkar(interaction.guild.id);
  await refresh(interaction, interaction.guild, null);
}

async function handleAzkarSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  if (interaction.customId === PANEL_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.reply({ ...buildPanel(interaction.guild, config.azkar), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === CONFIGURE_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.showModal(buildModal(config.azkar));
  }
  return handleRemove(interaction);
}

module.exports = { isAzkarSetupInteraction, handleAzkarSetupInteraction };
