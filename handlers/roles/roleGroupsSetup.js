'use strict';
const { PermissionFlagsBits } = require('discord.js');
const {
  getGuildConfig,
  addJailerRole, removeJailerRole,
  addMuterRole, removeMuterRole,
  addVerificatorRole, removeVerificatorRole,
} = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const MAX_ROLES = 7;
const ID = '1398395532103254157';

const GROUPS = {
  jailer: { label: 'Jailer', field: 'jailerRoleIds', add: addJailerRole, remove: removeJailerRole },
  muter: { label: 'Muter', field: 'muterRoleIds', add: addMuterRole, remove: removeMuterRole },
  verificator: { label: 'Verificator', field: 'verificatorRoleIds', add: addVerificatorRole, remove: removeVerificatorRole },
};
for (const [name, group] of Object.entries(GROUPS)) {
  Object.assign(group, {
    name,
    panel: `setup_${name}_${ID}`,
    add_id: `setup_add_${name}_${ID}`,
    remove_id: `setup_remove_${name}_${ID}`,
    addModal: `${name}_add_modal`,
    removeModal: `${name}_remove_modal`,
    addField: `${name}_add_roles`,
    removeField: `${name}_remove_roles`,
  });
}

const ALL_GROUPS = Object.values(GROUPS);
const BUTTON_IDS = ALL_GROUPS.flatMap((g) => [g.panel, g.add_id, g.remove_id]);
const MODAL_IDS = ALL_GROUPS.flatMap((g) => [g.addModal, g.removeModal]);
const groupOf = (customId) => ALL_GROUPS.find((g) => [g.panel, g.add_id, g.remove_id, g.addModal, g.removeModal].includes(customId));

const isRoleGroupsInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const savedIds = (config, group) => (Array.isArray(config[group.field]) ? config[group.field] : []);

function buildPanel(group, ids) {
  const list = ids.length ? ids.map((id) => `- <@&${id}>  ⁘`).join('\n') : `- __No ${group.name} roles configured__  ⁘`;
  return {
    flags: COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 10, content: `## ${SETUP_EMOJI.param} ${group.label}` },
          divider(),
          {
            type: 10,
            content: `- ${SETUP_EMOJI.dropdown} __Configure ${group.label} settings. Use the buttons below to add or remove roles (max ${MAX_ROLES}).__  ⁘`,
          },
          divider(),
          { type: 10, content: `- __Current ${group.label} Roles ${ids.length}/${MAX_ROLES} :__  ⁘\n${list}` },
          divider(),
          {
            type: 1,
            components: [
              { type: 2, style: 2, label: `${group.label} Add`, custom_id: group.add_id, disabled: ids.length >= MAX_ROLES },
              { type: 2, style: 2, label: `${group.label} Remove`, custom_id: group.remove_id, disabled: ids.length === 0 },
            ],
          },
        ],
        spoiler: false,
      },
    ],
  };
}

function buildAddModal(group, remaining) {
  return {
    title: `Add ${group.label} Roles`,
    custom_id: group.addModal,
    components: [
      label('Roles', `Members with these roles can use &${group.name}`, {
        type: 6, custom_id: group.addField, placeholder: 'Select roles', min_values: 1, max_values: remaining,
      }),
    ],
  };
}

function buildRemoveModal(guild, group, ids) {
  const options = ids.map((id) => {
    const role = guild.roles.cache.get(id);
    return role
      ? { label: role.name.slice(0, 100), value: id }
      : { label: 'Deleted role', value: id, description: `ID: ${id}` };
  });
  return {
    title: `Remove ${group.label} Roles`,
    custom_id: group.removeModal,
    components: [
      label('Roles to remove', `Select the ${group.name} roles you want to remove`, {
        type: 3, custom_id: group.removeField, placeholder: 'Select roles', min_values: 1, max_values: options.length, options,
      }),
    ],
  };
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change this__'));
  return false;
}

function rejectionReason(role, currentIds, guildId) {
  if (currentIds.includes(role.id)) return 'already added';
  if (role.id === guildId) return "@everyone can't be used";
  return null;
}

function refreshPanel(interaction, group, ids) {
  return interaction.isFromMessage()
    ? interaction.update(buildPanel(group, ids))
    : interaction.reply({ ...buildPanel(group, ids), flags: COMPONENTS_V2 | EPHEMERAL });
}

async function handleAdd(interaction, group, ids) {
  const picked = [...interaction.fields.getSelectedRoles(group.addField, true).keys()];
  const added = [];
  const skipped = [];
  for (const id of picked) {
    const role = interaction.guild.roles.cache.get(id);
    if (!role) continue;
    const reason = rejectionReason(role, [...ids, ...added.map((r) => r.id)], interaction.guild.id);
    if (reason) skipped.push({ role, reason });
    else if (ids.length + added.length >= MAX_ROLES) skipped.push({ role, reason: `limit of ${MAX_ROLES} reached` });
    else added.push(role);
  }

  for (const role of added) await group.add(interaction.guild.id, role.id);
  const next = [...ids, ...added.map((r) => r.id)];
  await refreshPanel(interaction, group, next);
  if (skipped.length) {
    await interaction.followUp(notice(skipped.flatMap(({ role, reason }) => [`__Skipped__ : ${role}`, `__Reason__ : ${reason}`])));
  }
}

async function handleRemove(interaction, group, ids) {
  const toRemove = interaction.fields.getStringSelectValues(group.removeField);
  for (const id of toRemove) await group.remove(interaction.guild.id, id);
  const next = ids.filter((id) => !toRemove.includes(id));
  await refreshPanel(interaction, group, next);
}

async function handleRoleGroupsInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  const group = groupOf(interaction.customId);
  if (!group) return;
  if (!(await requireManager(interaction))) return;

  const ids = savedIds(await getGuildConfig(interaction.guild.id), group);

  if (interaction.isModalSubmit()) {
    return interaction.customId === group.addModal ? handleAdd(interaction, group, ids) : handleRemove(interaction, group, ids);
  }

  if (interaction.customId === group.panel) {
    return interaction.reply({ ...buildPanel(group, ids), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === group.add_id) {
    const remaining = MAX_ROLES - ids.length;
    if (remaining <= 0) return interaction.reply(notice(`__You already have ${MAX_ROLES}/${MAX_ROLES} ${group.name} roles - remove one first__`));
    return interaction.showModal(buildAddModal(group, remaining));
  }
  if (!ids.length) return interaction.reply(notice(`__There are no ${group.name} roles to remove__`));
  return interaction.showModal(buildRemoveModal(interaction.guild, group, ids));
}

module.exports = { isRoleGroupsInteraction, handleRoleGroupsInteraction };
