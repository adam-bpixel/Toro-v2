'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI, HONEYPOT_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_honeypot_${ID}`;
const ADD_BUTTON_ID = `setup_add_honeypot_${ID}`;
const REMOVE_BUTTON_ID = `setup_remove_honeypot_${ID}`;
const MODAL_ID = 'setup_honeypot_modal';
const CHANNEL_FIELD = 'setup_honeypot_channel';
const BANNER_URL = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&';

const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID];

const isHoneypotSetupInteraction = (interaction) =>
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
        { type: 12, items: [{ media: { url: BANNER_URL }, description: `${guild.name} Honeypot`, spoiler: false }] },
        divider(),
        { type: 10, content: `## ${SETUP_EMOJI.param} Honeypot Channel` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __A trap channel that softbans anyone who sends a message in it.__  ⁘` },
        divider(),
        {
          type: 10,
          content: [
            `- __Honeypot Channel :__ ${channel ? `${channel}` : '`Not set`'}  ⁘`,
            `- __Accounts Caught :__ **${(settings && settings.caught) || 0}**  ⁘`,
            `- __Status :__ ${settings ? 'Active' : 'Inactive'}  ⁘`,
          ].join('\n'),
        },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Change Channel', custom_id: ADD_BUTTON_ID },
            { type: 2, style: 2, label: 'Remove Honeypot', custom_id: REMOVE_BUTTON_ID, disabled: !settings },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

function buildModal(settings) {
  return {
    title: 'Honeypot Setup',
    custom_id: MODAL_ID,
    components: [
      label('Trap channel', 'Anyone who posts in this channel is softbanned', {
        type: 8,
        custom_id: CHANNEL_FIELD,
        channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        min_values: 1,
        max_values: 1,
        default_values: settings && settings.channelId ? [{ type: 'channel', id: settings.channelId }] : undefined,
      }),
    ],
  };
}

function buildTrapMessage(caught) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: null,
      components: [
        { type: 10, content: `## ${HONEYPOT_EMOJI.pot} Honeypot Channel` },
        divider(),
        { type: 10, content: '- __This channel is a trap for compromised accounts.__  ༯\n- __Sending any message here will result in a softban.__  ༯' },
        divider(),
        { type: 10, content: `-# ${HONEYPOT_EMOJI.brand} ༯ __Accounts Caught :__ **${caught}**` },
      ],
      spoiler: false,
    }],
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

  const me = interaction.guild.members.me;
  if (!me.permissionsIn(channel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageMessages])) {
    return interaction.reply(notice(`__I need View Channel, Send Messages, Ban Members and Manage Messages to trap__ ${channel}`));
  }

  const existing = (await getGuildConfig(interaction.guild.id)).honeypot;
  if (existing && existing.channelId && existing.messageId) {
    const oldChannel = interaction.guild.channels.cache.get(existing.channelId);
    if (oldChannel) await oldChannel.messages.delete(existing.messageId).catch(() => {});
  }

  const caught = (existing && existing.caught) || 0;
  const sent = await channel.send(buildTrapMessage(caught)).catch(() => null);
  if (!sent) return interaction.reply(notice(`__I couldn't send the trap message in__ ${channel}`));

  await updateGuildConfig(interaction.guild.id, { $set: { honeypot: { channelId: channel.id, caught, messageId: sent.id } } });

  const config = await getGuildConfig(interaction.guild.id);
  await refresh(interaction, interaction.guild, config.honeypot);
}

async function handleRemove(interaction) {
  const config = await getGuildConfig(interaction.guild.id);
  const existing = config.honeypot;
  if (existing && existing.channelId && existing.messageId) {
    const channel = interaction.guild.channels.cache.get(existing.channelId);
    if (channel) await channel.messages.delete(existing.messageId).catch(() => {});
  }
  await updateGuildConfig(interaction.guild.id, { $unset: { honeypot: '' } });
  await refresh(interaction, interaction.guild, null);
}

async function handleHoneypotSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  if (interaction.customId === PANEL_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.reply({ ...buildPanel(interaction.guild, config.honeypot), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === ADD_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.showModal(buildModal(config.honeypot));
  }
  return handleRemove(interaction);
}

async function checkHoneypot(message) {
  const config = await getGuildConfig(message.guild.id);
  const settings = config.honeypot;
  if (!settings || !settings.channelId || message.channel.id !== settings.channelId) return false;

  const member = message.member;
  if (!member) return false;
  if (member.id === message.client.user.id) return false;
  if (member.id === message.guild.ownerId) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.BanMembers)) return false;

  const me = message.guild.members.me;
  if (me.roles.highest.position <= member.roles.highest.position) return false;

  await message.delete().catch(() => {});
  await member.send(`You tripped a honeypot trap in **${message.guild.name}** and were softbanned (your messages were deleted, you may rejoin).`).catch(() => {});
  const banned = await message.guild.members.ban(member.id, { reason: 'Honeypot trap triggered', deleteMessageSeconds: 7 * 86400 }).catch(() => null);
  if (banned) await message.guild.members.unban(member.id, 'Honeypot trap').catch(() => {});

  await updateGuildConfig(message.guild.id, { $inc: { 'honeypot.caught': 1 } });
  const caught = ((await getGuildConfig(message.guild.id)).honeypot || {}).caught || 1;
  if (settings.messageId) {
    const trapMessage = await message.channel.messages.fetch(settings.messageId).catch(() => null);
    if (trapMessage) await trapMessage.edit(buildTrapMessage(caught)).catch(() => {});
  }
  return true;
}

module.exports = { isHoneypotSetupInteraction, handleHoneypotSetupInteraction, checkHoneypot };
