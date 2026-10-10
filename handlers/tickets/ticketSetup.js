'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, patchTicketConfig } = require('../../models/core/moderation');
const { container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { buildTicketPanel } = require('./ticketUI');
const { rehostImage } = require('../../services/imageHost');
const { disablePanelMessage } = require('../../utils/runtime/panels');

const EPHEMERAL = 1 << 6;
const SETUP_BUTTON_ID = 'setup_ticket_1398395532103254157';
const SETUP_MODAL_ID = 'ticket_setup_modal';

const notice = (line, title = 'Notice') => ({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title, lines: [line] })] });

function label(text, description, component) {
  return { type: 18, label: text, description, component };
}

function channelDefault(guild, existingChannelId) {
  return existingChannelId && guild.channels.cache.has(existingChannelId)
    ? [{ type: 'channel', id: existingChannelId }]
    : undefined;
}

function buildTicketSetupModal(guild, config = {}) {
  return {
    title: 'Ticket System Setup',
    custom_id: SETUP_MODAL_ID,
    components: [
      label('Ticket Category', 'Where new ticket channels are created', {
        type: 8,
        custom_id: 'ticket_category',
        channel_types: [ChannelType.GuildCategory],
        min_values: 1,
        max_values: 1,
        default_values: channelDefault(guild, config.ticketCategoryId),
      }),
      label('Log Channel', 'Where ticket open/close logs are sent', {
        type: 8,
        custom_id: 'ticket_log_channel',
        channel_types: [ChannelType.GuildText],
        min_values: 1,
        max_values: 1,
        default_values: channelDefault(guild, config.ticketLogChannelId),
      }),
      label('Panel Channel', 'Where the "open a ticket" panel is posted', {
        type: 8,
        custom_id: 'ticket_panel_channel',
        channel_types: [ChannelType.GuildText],
        min_values: 1,
        max_values: 1,
        default_values: channelDefault(guild, config.ticketPanelChannelId),
      }),
      label('Panel Style', 'Buttons or a dropdown menu', {
        type: 3,
        custom_id: 'ticket_panel_style',
        min_values: 1,
        max_values: 1,
        options: [
          { label: 'Buttons', value: 'button', description: 'A row of buttons, one per category', default: config.ticketPanelStyle === 'button' },
          { label: 'Select Menu', value: 'menu', description: 'A single dropdown with every category', default: config.ticketPanelStyle === 'menu' },
        ],
      }),
      label('Panel Image (optional)', 'Shown above the buttons', {
        type: 19,
        custom_id: 'ticket_panel_image',
        min_values: 0,
        max_values: 1,
        required: false,
        file_types: ['image'],
      }),
    ],
  };
}

async function openTicketConfigPanel(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change ticket settings__'));
  }
  const config = await getGuildConfig(interaction.guild.id);
  return interaction.showModal(buildTicketSetupModal(interaction.guild, config));
}

async function handleTicketSetupModalSubmit(interaction) {
  const { guild } = interaction;
  const category = interaction.fields.getSelectedChannels('ticket_category', true, [ChannelType.GuildCategory]).first();
  const logChannel = interaction.fields.getSelectedChannels('ticket_log_channel', true, [ChannelType.GuildText]).first();
  const panelChannel = interaction.fields.getSelectedChannels('ticket_panel_channel', true, [ChannelType.GuildText]).first();
  const [style] = interaction.fields.getStringSelectValues('ticket_panel_style');
  const uploadedImage = interaction.fields.getUploadedFiles('ticket_panel_image')?.first() || null;

  await interaction.deferReply({ flags: COMPONENTS_V2 | EPHEMERAL });

  const me = guild.members.me;
  if (!me.permissionsIn(panelChannel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    return interaction.editReply(notice(`__I can't send messages in__ ${panelChannel}`));
  }
  if (!me.permissionsIn(logChannel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    return interaction.editReply(notice(`__I can't send messages in__ ${logChannel}`));
  }
  if (!me.permissionsIn(category).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels])) {
    return interaction.editReply(notice(`__I can't manage channels in the__ **${category.name}** __category__`));
  }

  let imageURL = null;
  if (uploadedImage) {
    try {
      imageURL = await rehostImage(uploadedImage);
    } catch (error) {
      console.error('Rehosting ticket panel image failed:', error);
      return interaction.editReply(notice('__Could not save the panel image - please try again with a different image__'));
    }
  }

  const previous = await getGuildConfig(guild.id);
  const panelPayload = buildTicketPanel(guild, style, imageURL, previous.customTicketCategories);
  let panelMessage;
  try {
    panelMessage = await panelChannel.send(panelPayload);
  } catch (error) {
    console.error('Posting ticket panel failed:', error);
    return interaction.editReply(notice('__Could not post the ticket panel to that channel__'));
  }

  await disablePanelMessage(guild, previous.ticketPanelChannelId, previous.ticketPanelMessageId);

  await patchTicketConfig(guild.id, {
    categoryId: category.id,
    logChannelId: logChannel.id,
    panelChannelId: panelChannel.id,
    panelMessageId: panelMessage.id,
    panelStyle: style,
    panelImageURL: imageURL,
  });

  return interaction.editReply(notice(`__Ticket system configured and panel posted in__ ${panelChannel}`, 'Ticket System'));
}

module.exports = {
  SETUP_BUTTON_ID,
  SETUP_MODAL_ID,
  buildTicketSetupModal,
  openTicketConfigPanel,
  handleTicketSetupModalSubmit,
};
