'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../models/core/moderation');
const { prefixFor } = require('../../models/settings/prefix');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const BANNER_URL = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&';
const PANEL_BUTTON_ID = `setup_welcomer_${ID}`;
const ADD_BUTTON_ID = `setup_add_welcome_${ID}`;
const REMOVE_BUTTON_ID = `setup_remove_welcome_${ID}`;
const MODAL_ID = 'setup_welcomer_modal';
const CHANNEL_FIELD = 'setup_welcomer_channel';
const MESSAGE_FIELD = 'setup_welcomer_message';
const DEFAULT_MESSAGE = 'Welcome to {guild.name}, {user.mention}!';

const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID];

const isWelcomerSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const label = (text, description, component, required = true) => ({ type: 18, label: text, description, component: { ...component, required } });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildPanel(guild, settings, prefix) {
  const channel = settings && guild.channels.cache.get(settings.channelId);
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 12, items: [{ media: { url: BANNER_URL }, description: `${guild.name} Welcome`, spoiler: false }] },
        divider(),
        { type: 10, content: `## ${SETUP_EMOJI.param} Welcome Notification` },
        divider(),
        {
          type: 10,
          content: [
            `- ${SETUP_EMOJI.dropdown} __Configure welcome notification channel and custom message.__  ⁘`,
            `- ${SETUP_EMOJI.dropdown} __Use \`${prefix}variables\` to show available variables.__  ⁘`,
          ].join('\n'),
        },
        divider(),
        {
          type: 10,
          content: [
            `- __Welcome Channel :__ ${channel ? `${channel}` : 'Not configured'}  ⁘`,
            `- __Welcome Message :__ \`${(settings && settings.message) || DEFAULT_MESSAGE}\`  ⁘`,
          ].join('\n'),
        },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Set Welcome Channel', custom_id: ADD_BUTTON_ID },
            { type: 2, style: 2, label: 'Remove Welcome', custom_id: REMOVE_BUTTON_ID, disabled: !settings },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

function buildModal(settings) {
  return {
    title: 'Welcomer Setup',
    custom_id: MODAL_ID,
    components: [
      label('Welcome Channel', undefined, {
        type: 8,
        custom_id: CHANNEL_FIELD,
        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        min_values: 1,
        max_values: 1,
        default_values: settings && settings.channelId ? [{ type: 'channel', id: settings.channelId }] : undefined,
      }),
      label('Welcome Message', undefined, {
        type: 4,
        custom_id: MESSAGE_FIELD,
        style: 2,
        max_length: 1000,
        value: settings ? settings.message : DEFAULT_MESSAGE,
        placeholder: DEFAULT_MESSAGE,
      }, false),
    ],
  };
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change this__'));
  return false;
}

async function refresh(interaction, guild, settings) {
  const prefix = await prefixFor(guild.id);
  const panel = buildPanel(guild, settings, prefix);
  return interaction.isFromMessage() ? interaction.update(panel) : interaction.reply({ ...panel, flags: COMPONENTS_V2 | EPHEMERAL });
}

async function handleSubmit(interaction) {
  const channel = interaction.fields.getSelectedChannels(CHANNEL_FIELD, true, [ChannelType.GuildText, ChannelType.GuildAnnouncement]).first();
  const message = interaction.fields.getTextInputValue(MESSAGE_FIELD).trim() || DEFAULT_MESSAGE;

  const me = interaction.guild.members.me;
  if (!me.permissionsIn(channel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    return interaction.reply(notice(`__I can't send messages in__ ${channel}`));
  }

  await updateGuildConfig(interaction.guild.id, { $set: { welcomer: { channelId: channel.id, message } } });

  const config = await getGuildConfig(interaction.guild.id);
  await refresh(interaction, interaction.guild, config.welcomer);
}

async function handleRemove(interaction) {
  await updateGuildConfig(interaction.guild.id, { $unset: { welcomer: '' } });
  await refresh(interaction, interaction.guild, null);
}

async function handleWelcomerSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  if (interaction.customId === PANEL_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    const prefix = await prefixFor(interaction.guild.id);
    return interaction.reply({ ...buildPanel(interaction.guild, config.welcomer, prefix), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === ADD_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.showModal(buildModal(config.welcomer));
  }
  return handleRemove(interaction);
}

function formatWelcomerMessage(template, member) {
  return template
    .replace(/\{guild\.name\}/g, member.guild.name)
    .replace(/\{guild\.count\}/g, member.guild.memberCount)
    .replace(/\{user\.mention\}/g, `${member}`)
    .replace(/\{user\.name\}/g, member.user.username)
    .replace(/\{user\.display_name\}/g, member.displayName)
    .replace(/\{user\.id\}/g, member.id);
}

async function sendWelcomer(member) {
  const config = await getGuildConfig(member.guild.id);
  const settings = config.welcomer;
  if (!settings || !settings.channelId) return;
  const channel = member.guild.channels.cache.get(settings.channelId);
  if (!channel) return;
  const me = member.guild.members.me;
  if (!me.permissionsIn(channel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return;
  await channel.send({ content: formatWelcomerMessage(settings.message, member), allowedMentions: { parse: ['users'] } });
}

module.exports = { isWelcomerSetupInteraction, handleWelcomerSetupInteraction, sendWelcomer };
