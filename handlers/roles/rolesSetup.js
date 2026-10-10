'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig, setJailRole } = require('../../models/core/moderation');
const clans = require('../../models/economy/clans');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI, ROLES_EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../tickets/ticketUI');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_roles_button_${ID}`;
const CONFIGURE_BUTTON_ID = `setup_roles_configure_${ID}`;
const MODAL_ID = 'roles_configure_modal';
const TYPE_FIELD_ID = 'roles_configure_type';
const ROLE_FIELD_ID = 'roles_configure_role';

const BUTTON_IDS = [PANEL_BUTTON_ID, CONFIGURE_BUTTON_ID];

const isRolesSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && interaction.customId === MODAL_ID);

const ROLE_TYPES = [
  { key: 'jail', label: 'Jail Role', emoji: ROLES_EMOJI.jail, get: (c) => c.jailRoleId, set: (guildId, id) => setJailRole(guildId, id) },
  { key: 'muted', label: 'Muted Role', emoji: ROLES_EMOJI.muted, get: (c) => c.mutedRoleId, set: (guildId, id) => updateGuildConfig(guildId, { $set: { mutedRoleId: id } }) },
  { key: 'boy', label: 'Verified Boy Role', emoji: ROLES_EMOJI.boy, get: (c) => c.verification?.boyRoleId, set: (guildId, id) => updateGuildConfig(guildId, { $set: { 'verification.boyRoleId': id } }) },
  { key: 'girl', label: 'Verified Girl Role', emoji: ROLES_EMOJI.girl, get: (c) => c.verification?.girlRoleId, set: (guildId, id) => updateGuildConfig(guildId, { $set: { 'verification.girlRoleId': id } }) },
  { key: 'unverified', label: 'Unverified Role', emoji: ROLES_EMOJI.unverified, get: (c) => c.verification?.unverifiedRoleId, set: (guildId, id) => updateGuildConfig(guildId, { $set: { 'verification.unverifiedRoleId': id } }) },
  { key: 'leader', label: 'Clan Leader Role', emoji: ROLES_EMOJI.leader, get: (c) => c.clanLeaderRoleId, set: (guildId, id) => clans.setSetupRole(guildId, 'leader', id) },
  { key: 'coleader', label: 'Clan Co-Leader Role', emoji: ROLES_EMOJI.coleader, get: (c) => c.clanCoLeaderRoleId, set: (guildId, id) => clans.setSetupRole(guildId, 'coleader', id) },
];
const typeOf = (key) => ROLE_TYPES.find((t) => t.key === key);

const BANNER_URL = 'https://cdn.discordapp.com/attachments/1452032880552448020/1475655220431425779/ezgif-7330ede79c09b445.gif?ex=6aba61c4&is=6ab91044&hm=2b7b2772736eee4d9a05c0a9103934454f799edef5be2e7cc93c657157da2829&';

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function buildPanel(guild, config) {
  const line = (type) => {
    const id = type.get(config);
    const shown = id && guild.roles.cache.has(id) ? `<@&${id}>` : 'Not configured';
    return `${type.emoji} __${type.label} ›__ ${shown}`;
  };
  return {
    flags: COMPONENTS_V2 | EPHEMERAL,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 12, items: [{ media: { url: BANNER_URL }, description: `${guild.name}'s server Roles`, spoiler: false }] },
        divider(),
        { type: 10, content: `## ${SETUP_EMOJI.param} Server Roles` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Configure various role settings for the server. Click the button below to configure__  ⁘` },
        divider(),
        { type: 10, content: '## Current Roles' },
        divider(),
        { type: 10, content: ROLE_TYPES.map(line).join('\n\n') },
        divider(),
        { type: 1, components: [{ type: 2, style: 2, label: 'Configure Role', emoji: parseEmoji(SETUP_EMOJI.param), custom_id: CONFIGURE_BUTTON_ID }] },
      ],
      spoiler: false,
    }],
  };
}

const buildConfigureModal = () => ({
  title: 'Configure Role',
  custom_id: MODAL_ID,
  components: [
    label('Role Type', 'Which role setting to change', {
      type: 3,
      custom_id: TYPE_FIELD_ID,
      placeholder: 'Select a role type',
      min_values: 1,
      max_values: 1,
      options: ROLE_TYPES.map((t) => ({ label: t.label, value: t.key, emoji: parseEmoji(t.emoji) })),
    }),
    label('Role', 'The role to use for it', { type: 6, custom_id: ROLE_FIELD_ID, placeholder: 'Select a role', min_values: 1, max_values: 1 }),
  ],
});

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change server roles__'));
  return false;
}

const refreshPanel = (interaction, guild, config) =>
  interaction.isFromMessage()
    ? interaction.update(buildPanel(guild, config))
    : interaction.reply(buildPanel(guild, config));

async function handleConfigureSubmit(interaction) {
  const typeKey = interaction.fields.getStringSelectValues(TYPE_FIELD_ID)[0];
  const type = typeOf(typeKey);
  if (!type) return interaction.reply(notice('__That role setting is not valid__'));

  const roleId = [...interaction.fields.getSelectedRoles(ROLE_FIELD_ID, true).keys()][0];
  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) return interaction.reply(notice("__Couldn't find that role__"));
  if (role.id === interaction.guild.id) return interaction.reply(notice("__@everyone can't be used here__"));
  if (role.managed) return interaction.reply(notice('__A role managed by an integration or bot cannot be used here__'));

  await type.set(interaction.guild.id, role.id);
  const config = await getGuildConfig(interaction.guild.id);
  await refreshPanel(interaction, interaction.guild, config);
}

async function handleRolesSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) return handleConfigureSubmit(interaction);

  if (interaction.customId === PANEL_BUTTON_ID) {
    const config = await getGuildConfig(interaction.guild.id);
    return interaction.reply(buildPanel(interaction.guild, config));
  }
  return interaction.showModal(buildConfigureModal());
}

module.exports = { isRolesSetupInteraction, handleRolesSetupInteraction };
