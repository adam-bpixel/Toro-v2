'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');
const { serverAllowed } = require('../../models/economy/premium');
const { settingsOf, saveSetup, saveHub, roomName } = require('./tempvoice');

const EPHEMERAL = 1 << 6;
const PANEL_BUTTON_ID = 'setup_tempvoice_1398395532103254157';
const EDIT_BUTTON_ID = 'setup_tempvoice_edit_1398395532103254157';
const OFF_BUTTON_ID = 'setup_tempvoice_off_1398395532103254157';
const MODAL_ID = 'tempvoice_setup_modal';
const INTERFACE_FIELD = 'tempvoice_interface';
const VOICE_FIELD = 'tempvoice_channel';
const TEMPLATE_FIELD = 'tempvoice_template';

const isTempVoiceSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && [PANEL_BUTTON_ID, EDIT_BUTTON_ID, OFF_BUTTON_ID].includes(interaction.customId))
  || (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const label = (text, description, component, required = true) => ({ type: 18, label: text, description, component: { ...component, required } });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines) => ({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title: 'Notice', lines: Array.isArray(lines) ? lines : [lines] })] });
const defaults = (id) => (id ? [{ type: 'channel', id }] : undefined);

function buildPanel(guild, settings) {
  const voice = settings.hubId && guild.channels.cache.get(settings.hubId);
  const text = settings.interfaceId && guild.channels.cache.get(settings.interfaceId);
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${SETUP_EMOJI.param} Temp Voice` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Joining the temp voice channel makes a room for the member, with a control panel to manage it.__  ⁘` },
        divider(),
        {
          type: 10,
          content: [
            `- __Temp voice channel :__ ${voice ? `${voice}` : '`Not set`'}  ⁘`,
            `- __Interface channel :__ ${text ? `${text}` : '`Not set`'}  ⁘`,
            `- __Name template :__ ${settings.nameTemplate ? `\`${settings.nameTemplate}\`` : '`Not set`'}  ⁘`,
          ].join('\n'),
        },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Configure', custom_id: EDIT_BUTTON_ID },
            { type: 2, style: 4, label: 'Turn Off', custom_id: OFF_BUTTON_ID, disabled: !settings.hubId },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

function buildModal(guild, settings) {
  return {
    title: 'Temp Voice Setup',
    custom_id: MODAL_ID,
    components: [
      label('Interface Channel', 'The text channel the control panel is sent in (optional)', {
        type: 8, custom_id: INTERFACE_FIELD, channel_types: [ChannelType.GuildText], min_values: 0, max_values: 1, default_values: defaults(settings.interfaceId),
      }, false),
      label('Temp Voice Channel', 'Joining it creates a room for the member', {
        type: 8, custom_id: VOICE_FIELD, channel_types: [ChannelType.GuildVoice], min_values: 1, max_values: 1, default_values: defaults(settings.hubId),
      }),
      label('Name Template', "Empty = just the member's name. {user} = their name", {
        type: 4, custom_id: TEMPLATE_FIELD, style: 1, placeholder: "{user}'s room", max_length: 80, value: settings.nameTemplate || undefined,
      }, false),
    ],
  };
}

const refresh = (interaction, guild, settings) => (interaction.isFromMessage()
  ? interaction.update(buildPanel(guild, settings))
  : interaction.reply({ ...buildPanel(guild, settings), flags: COMPONENTS_V2 | EPHEMERAL }));

async function handleSubmit(interaction) {
  const { guild } = interaction;
  const voice = interaction.fields.getSelectedChannels(VOICE_FIELD, true, [ChannelType.GuildVoice]).first();
  const text = interaction.fields.getSelectedChannels(INTERFACE_FIELD, false, [ChannelType.GuildText])?.first() || null;
  const template = (interaction.fields.getTextInputValue(TEMPLATE_FIELD) || '').trim();

  const me = guild.members.me;
  if (!me.permissionsIn(voice).has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply(notice(`__I need the **Manage Channels** permission in__ ${voice}`));
  }
  if (text && !me.permissionsIn(text).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    return interaction.reply(notice(`__I can't send messages in__ ${text}`));
  }

  await saveSetup(guild.id, { hubId: voice.id, interfaceId: text ? text.id : null, nameTemplate: template });
  await refresh(interaction, guild, await settingsOf(guild.id));

  const lines = [`__Example room name :__ **${roomName({ displayName: interaction.member.displayName, user: interaction.user }, template)}**`];
  if (text) lines.push(`__Interface channel :__ ${text}`);
  return interaction.followUp(notice(lines));
}

async function handleTempVoiceSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change this__'));
  }
  if (!(await serverAllowed({ guild: interaction.guild }))) {
    return interaction.reply(notice('__Temp Voice requires an **active Premium subscription** for this server__'));
  }

  if (interaction.isModalSubmit()) return handleSubmit(interaction);

  const settings = await settingsOf(interaction.guildId);

  if (interaction.customId === OFF_BUTTON_ID) {
    await saveHub(interaction.guildId, null);
    await refresh(interaction, interaction.guild, await settingsOf(interaction.guildId));
    return interaction.followUp(notice('__Temp Voice was turned off__'));
  }

  if (interaction.customId === EDIT_BUTTON_ID) {
    return interaction.showModal(buildModal(interaction.guild, settings));
  }

  return refresh(interaction, interaction.guild, settings);
}

module.exports = { isTempVoiceSetupInteraction, handleTempVoiceSetupInteraction };
