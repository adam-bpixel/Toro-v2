'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setLevelRoles } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const MAX_LEVEL_ROLES = 25;
const MAX_BYPASS = 10;
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;
const BANNER = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&';

const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_levelroles_${ID}`;
const ADD_ID = `setup_add_levelroles_${ID}`;
const REMOVE_ID = `setup_remove_levelroles_${ID}`;
const BYPASS_ADD_ID = `setup_add_bypass_levelroles_${ID}`;
const BYPASS_REMOVE_ID = `setup_remove_bypass_levelroles_${ID}`;
const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_ID, REMOVE_ID, BYPASS_ADD_ID, BYPASS_REMOVE_ID];

const ADD_MODAL = 'levelroles_add_modal';
const REMOVE_MODAL = 'levelroles_remove_modal';
const BYPASS_ADD_MODAL = 'levelroles_bypass_add_modal';
const BYPASS_REMOVE_MODAL = 'levelroles_bypass_remove_modal';
const MODAL_IDS = [ADD_MODAL, REMOVE_MODAL, BYPASS_ADD_MODAL, BYPASS_REMOVE_MODAL];

const LEVEL_FIELD = 'levelroles_level';
const ROLE_FIELD = 'levelroles_role';
const REMOVE_FIELD = 'levelroles_remove';
const BYPASS_ADD_FIELD = 'levelroles_bypass_roles';
const BYPASS_REMOVE_FIELD = 'levelroles_bypass_remove';

const isLevelRolesInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const text = (content) => ({ type: 10, content });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const savedRoles = (config) => (Array.isArray(config.levelRoles) ? [...config.levelRoles].sort((a, b) => a.level - b.level) : []);
const savedBypass = (config) => (Array.isArray(config.levelBypassIds) ? config.levelBypassIds : []);

function buildPanel(guild, levelRoles, bypassIds) {
  const roles = levelRoles.length
    ? levelRoles.map((r) => `- Level ${r.level} : <@&${r.roleId}>  ⁘`).join('\n')
    : '- __No level roles configured__  ⁘';
  const bypass = bypassIds.length ? bypassIds.map((id) => `- <@&${id}>  ⁘`).join('\n') : '- __No bypass roles configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 12, items: [{ spoiler: false, media: { url: BANNER }, description: `${guild.name}'s server Level Roles` }] },
          divider(),
          text(`## ${SETUP_EMOJI.param} Level Roles`),
          divider(),
          text(`- ${SETUP_EMOJI.dropdown} __Configure Level Roles. Assign roles when members reach specific levels (max ${MAX_LEVEL_ROLES}).__  ⁘`),
          divider(),
          text(`- __Current Level Roles ${levelRoles.length}/${MAX_LEVEL_ROLES} :__  ⁘\n${roles}`),
          divider(),
          {
            type: 1,
            components: [
              { type: 2, style: 2, label: 'Level Role Add', custom_id: ADD_ID, disabled: levelRoles.length >= MAX_LEVEL_ROLES },
              { type: 2, style: 2, label: 'Level Role Remove', custom_id: REMOVE_ID, disabled: levelRoles.length === 0 },
            ],
          },
          divider(),
          text(`- ${SETUP_EMOJI.dropdown} __Bypass Roles (users with these roles won't receive level roles) :__  ⁘`),
          divider(),
          text(`- __Current Bypass Roles ${bypassIds.length}/${MAX_BYPASS} :__  ⁘\n${bypass}`),
          divider(),
          {
            type: 1,
            components: [
              { type: 2, style: 2, label: 'Bypass Add', custom_id: BYPASS_ADD_ID, disabled: bypassIds.length >= MAX_BYPASS },
              { type: 2, style: 2, label: 'Bypass Remove', custom_id: BYPASS_REMOVE_ID, disabled: bypassIds.length === 0 },
            ],
          },
        ],
        spoiler: false,
      },
    ],
  };
}

const buildAddModal = () => ({
  title: 'Add Level Role',
  custom_id: ADD_MODAL,
  components: [
    label('Level', undefined, {
      type: 4, custom_id: LEVEL_FIELD, style: 1, placeholder: `Enter level (${MIN_LEVEL}-${MAX_LEVEL})`,
      min_length: 1, max_length: 3, required: true,
    }),
    label('Select Role', undefined, {
      type: 6, custom_id: ROLE_FIELD, placeholder: 'Choose a role for this level', min_values: 1, max_values: 1, required: true,
    }),
  ],
});

const buildBypassAddModal = (remaining) => ({
  title: 'Add Bypass Roles',
  custom_id: BYPASS_ADD_MODAL,
  components: [
    label('Roles', 'Members with these roles will not receive level roles', {
      type: 6, custom_id: BYPASS_ADD_FIELD, placeholder: 'Select roles', min_values: 1, max_values: remaining,
    }),
  ],
});

const roleName = (guild, id) => guild.roles.cache.get(id)?.name.slice(0, 100) || 'Deleted role';

const buildRemoveModal = (guild, levelRoles) => ({
  title: 'Remove Level Roles',
  custom_id: REMOVE_MODAL,
  components: [
    label('Level roles to remove', 'Select the level roles you want to remove', {
      type: 3, custom_id: REMOVE_FIELD, placeholder: 'Select level roles', min_values: 1, max_values: levelRoles.length,
      options: levelRoles.map((r) => ({ label: roleName(guild, r.roleId), description: `Level ${r.level}`, value: String(r.level) })),
    }),
  ],
});

const buildBypassRemoveModal = (guild, ids) => ({
  title: 'Remove Bypass Roles',
  custom_id: BYPASS_REMOVE_MODAL,
  components: [
    label('Roles to remove', 'Select the bypass roles you want to remove', {
      type: 3, custom_id: BYPASS_REMOVE_FIELD, placeholder: 'Select roles', min_values: 1, max_values: ids.length,
      options: ids.map((id) => ({ label: roleName(guild, id), value: id, ...(guild.roles.cache.has(id) ? {} : { description: `ID: ${id}` }) })),
    }),
  ],
});

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change level roles__'));
  return false;
}

function rejectionReason(interaction, role) {
  const { guild } = interaction;
  if (role.id === guild.id) return "@everyone can't be assigned";
  if (role.managed) return 'managed by an integration or bot';
  if (role.position >= guild.members.me.roles.highest.position) return 'above my highest role';
  const isOwner = guild.ownerId === interaction.user.id;
  if (!isOwner && role.position >= (interaction.member?.roles?.highest?.position ?? 0)) return 'above your highest role';
  return null;
}

function refreshPanel(interaction, levelRoles, bypassIds) {
  const panel = buildPanel(interaction.guild, levelRoles, bypassIds);
  return interaction.isFromMessage() ? interaction.update(panel) : interaction.reply({ ...panel, flags: COMPONENTS_V2 | EPHEMERAL });
}

async function handleAdd(interaction, levelRoles, bypassIds) {
  const raw = interaction.fields.getTextInputValue(LEVEL_FIELD).trim();
  const level = Number(raw);
  if (!/^\d+$/.test(raw) || level < MIN_LEVEL || level > MAX_LEVEL) {
    return interaction.reply(notice(`__Level must be a number between ${MIN_LEVEL} and ${MAX_LEVEL}__`));
  }
  const role = interaction.fields.getSelectedRoles(ROLE_FIELD, true).first();
  const reason = rejectionReason(interaction, role);
  if (reason) return interaction.reply(notice([`__Skipped__ : ${role}`, `__Reason__ : ${reason}`]));

  const next = [...levelRoles.filter((r) => r.level !== level), { level, roleId: role.id }].sort((a, b) => a.level - b.level);
  if (next.length > MAX_LEVEL_ROLES) return interaction.reply(notice(`__You already have ${MAX_LEVEL_ROLES}/${MAX_LEVEL_ROLES} level roles - remove one first__`));
  await setLevelRoles(interaction.guild.id, { levelRoles: next });
  return refreshPanel(interaction, next, bypassIds);
}

async function handleRemove(interaction, levelRoles, bypassIds) {
  const levels = interaction.fields.getStringSelectValues(REMOVE_FIELD).map(Number);
  const next = levelRoles.filter((r) => !levels.includes(r.level));
  await setLevelRoles(interaction.guild.id, { levelRoles: next });
  return refreshPanel(interaction, next, bypassIds);
}

async function handleBypassAdd(interaction, levelRoles, bypassIds) {
  const picked = [...interaction.fields.getSelectedRoles(BYPASS_ADD_FIELD, true).keys()].filter((id) => !bypassIds.includes(id));
  const next = [...bypassIds, ...picked].slice(0, MAX_BYPASS);
  await setLevelRoles(interaction.guild.id, { levelBypassIds: next });
  return refreshPanel(interaction, levelRoles, next);
}

async function handleBypassRemove(interaction, levelRoles, bypassIds) {
  const toRemove = interaction.fields.getStringSelectValues(BYPASS_REMOVE_FIELD);
  const next = bypassIds.filter((id) => !toRemove.includes(id));
  await setLevelRoles(interaction.guild.id, { levelBypassIds: next });
  return refreshPanel(interaction, levelRoles, next);
}

async function handleLevelRolesInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  const config = await getGuildConfig(interaction.guild.id);
  const levelRoles = savedRoles(config);
  const bypassIds = savedBypass(config);

  if (interaction.isModalSubmit()) {
    const handler = {
      [ADD_MODAL]: handleAdd,
      [REMOVE_MODAL]: handleRemove,
      [BYPASS_ADD_MODAL]: handleBypassAdd,
      [BYPASS_REMOVE_MODAL]: handleBypassRemove,
    }[interaction.customId];
    return handler(interaction, levelRoles, bypassIds);
  }

  switch (interaction.customId) {
    case PANEL_BUTTON_ID:
      return interaction.reply({ ...buildPanel(interaction.guild, levelRoles, bypassIds), flags: COMPONENTS_V2 | EPHEMERAL });
    case ADD_ID:
      if (levelRoles.length >= MAX_LEVEL_ROLES) return interaction.reply(notice(`__You already have ${MAX_LEVEL_ROLES}/${MAX_LEVEL_ROLES} level roles - remove one first__`));
      return interaction.showModal(buildAddModal());
    case REMOVE_ID:
      if (!levelRoles.length) return interaction.reply(notice('__There are no level roles to remove__'));
      return interaction.showModal(buildRemoveModal(interaction.guild, levelRoles));
    case BYPASS_ADD_ID:
      if (bypassIds.length >= MAX_BYPASS) return interaction.reply(notice(`__You already have ${MAX_BYPASS}/${MAX_BYPASS} bypass roles - remove one first__`));
      return interaction.showModal(buildBypassAddModal(MAX_BYPASS - bypassIds.length));
    default:
      if (!bypassIds.length) return interaction.reply(notice('__There are no bypass roles to remove__'));
      return interaction.showModal(buildBypassRemoveModal(interaction.guild, bypassIds));
  }
}

async function giveLevelRoles(member, level) {
  const config = await getGuildConfig(member.guild.id);
  const bypassIds = savedBypass(config);
  if (bypassIds.some((id) => member.roles.cache.has(id))) return;

  const me = await member.guild.members.fetchMe();
  const roles = savedRoles(config)
    .filter((r) => r.level <= level)
    .map((r) => member.guild.roles.cache.get(r.roleId))
    .filter((role) => role && !member.roles.cache.has(role.id) && !role.managed && role.position < me.roles.highest.position);
  if (roles.length) await member.roles.add(roles, `Level roles (level ${level})`);
}

module.exports = { isLevelRolesInteraction, handleLevelRolesInteraction, giveLevelRoles, buildPanel };
