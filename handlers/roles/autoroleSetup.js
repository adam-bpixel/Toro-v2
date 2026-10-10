'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setAutoRoles } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const MAX_AUTOROLES = 3;
const PANEL_BUTTON_ID = 'setup_autorole_1398395532103254157';
const ADD_BUTTON_ID = 'setup_add_autorole_1398395532103254157';
const REMOVE_BUTTON_ID = 'setup_remove_autorole_1398395532103254157';
const ADD_MODAL_ID = 'autorole_add_modal';
const REMOVE_MODAL_ID = 'autorole_remove_modal';
const ADD_FIELD_ID = 'autorole_add_roles';
const REMOVE_FIELD_ID = 'autorole_remove_roles';

const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID];
const MODAL_IDS = [ADD_MODAL_ID, REMOVE_MODAL_ID];

const isAutoroleInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const savedIds = (config) => (Array.isArray(config.autoRoleIds) ? config.autoRoleIds : []);

function buildPanel(ids) {
  const list = ids.length ? ids.map((id) => `- <@&${id}>  ⁘`).join('\n') : '- __No autoroles configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 10, content: `## ${SETUP_EMOJI.param} Auto Role` },
          divider(),
          {
            type: 10,
            content: `- ${SETUP_EMOJI.dropdown} __Configure Auto Role settings. Use the buttons below to add or remove roles (max ${MAX_AUTOROLES}).__  ⁘`,
          },
          divider(),
          { type: 10, content: `- __Current Autoroles ${ids.length}/${MAX_AUTOROLES} :__  ⁘\n${list}` },
          divider(),
          {
            type: 1,
            components: [
              { type: 2, style: 2, label: 'Auto Role Add', custom_id: ADD_BUTTON_ID, disabled: ids.length >= MAX_AUTOROLES },
              { type: 2, style: 2, label: 'Auto Role Remove', custom_id: REMOVE_BUTTON_ID, disabled: ids.length === 0 },
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
    title: 'Add Auto Roles',
    custom_id: ADD_MODAL_ID,
    components: [
      label('Roles','New members will receive these roles', {
        type: 6,
        custom_id: ADD_FIELD_ID,
        placeholder: 'Select roles',
        min_values: 1,
        max_values: remaining,
      }),
    ],
  };
}

function buildRemoveModal(guild, ids) {
  const options = ids.map((id) => {
    const role = guild.roles.cache.get(id);
    return role
      ? { label: role.name.slice(0, 100), value: id }
      : { label: 'Deleted role', value: id, description: `ID: ${id}` };
  });
  return {
    title: 'Remove Auto Roles',
    custom_id: REMOVE_MODAL_ID,
    components: [
      label('Roles to remove', 'Select the auto roles you want to remove', {
        type: 3,
        custom_id: REMOVE_FIELD_ID,
        placeholder: 'Select roles',
        min_values: 1,
        max_values: options.length,
        options,
      }),
    ],
  };
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change auto roles__'));
  return false;
}

function rejectionReason(interaction, role, currentIds) {
  const { guild } = interaction;
  if (currentIds.includes(role.id)) return 'already an auto role';
  if (role.id === guild.id) return "@everyone can't be assigned";
  if (role.managed) return 'managed by an integration or bot';
  if (role.position >= guild.members.me.roles.highest.position) return 'above my highest role';
  const isOwner = guild.ownerId === interaction.user.id;
  if (!isOwner && role.position >= (interaction.member?.roles?.highest?.position ?? 0)) return 'above your highest role';
  return null;
}

function refreshPanel(interaction, ids) {
  return interaction.isFromMessage()
    ? interaction.update(buildPanel(ids))
    : interaction.reply({ ...buildPanel(ids), flags: COMPONENTS_V2 | EPHEMERAL });
}

async function handleAdd(interaction, ids) {
  const picked = [...interaction.fields.getSelectedRoles(ADD_FIELD_ID, true).keys()];
  const added = [];
  const skipped = [];
  for (const id of picked) {
    const role = interaction.guild.roles.cache.get(id);
    if (!role) continue;
    const reason = rejectionReason(interaction, role, [...ids, ...added.map((r) => r.id)]);
    if (reason) skipped.push({ role, reason });
    else if (ids.length + added.length >= MAX_AUTOROLES) skipped.push({ role, reason: `limit of ${MAX_AUTOROLES} reached` });
    else added.push(role);
  }

  const next = [...ids, ...added.map((r) => r.id)];
  if (added.length) await setAutoRoles(interaction.guild.id, next);
  await refreshPanel(interaction, next);
  if (skipped.length) {
    await interaction.followUp(notice(skipped.flatMap(({ role, reason }) => [`__Skipped__ : ${role}`, `__Reason__ : ${reason}`])));
  }
}

async function handleRemove(interaction, ids) {
  const toRemove = interaction.fields.getStringSelectValues(REMOVE_FIELD_ID);
  const next = ids.filter((id) => !toRemove.includes(id));
  await setAutoRoles(interaction.guild.id, next);
  await refreshPanel(interaction, next);
}

async function handleAutoroleInteraction(interaction) {
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
    const remaining = MAX_AUTOROLES - ids.length;
    if (remaining <= 0) return interaction.reply(notice(`__You already have ${MAX_AUTOROLES}/${MAX_AUTOROLES} auto roles - remove one first__`));
    return interaction.showModal(buildAddModal(remaining));
  }
  if (!ids.length) return interaction.reply(notice('__There are no auto roles to remove__'));
  return interaction.showModal(buildRemoveModal(interaction.guild, ids));
}

async function giveAutoRoles(member) {
  const ids = savedIds(await getGuildConfig(member.guild.id));
  if (!ids.length) return;

  const me = await member.guild.members.fetchMe();
  const roles = ids
    .map((id) => member.guild.roles.cache.get(id))
    .filter((role) => role && !role.managed && role.id !== member.guild.id && role.position < me.roles.highest.position);
  if (roles.length) await member.roles.add(roles, 'Auto role');
}

module.exports = {
  isAutoroleInteraction,
  handleAutoroleInteraction,
  giveAutoRoles,
  buildPanel,
  rejectionReason,
  savedIds,
  MAX_AUTOROLES,
};
