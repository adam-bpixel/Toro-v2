'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../models/core/moderation');
const clans = require('../../models/economy/clans');
const { container, textBlock, divider, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI, EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const ID = '1398395532103254157';
const PANEL_BUTTON_ID = `setup_clanmanager_${ID}`;
const ADD_BUTTON_ID = `setup_add_clanmanager_${ID}`;
const REMOVE_BUTTON_ID = `setup_remove_clanmanager_${ID}`;
const ADD_MODAL_ID = 'clanmanager_add_modal';
const REMOVE_MODAL_ID = 'clanmanager_remove_modal';
const ADD_FIELD_ID = 'clanmanager_add_roles';
const REMOVE_FIELD_ID = 'clanmanager_remove_roles';
const MAX = clans.MAX_MANAGER_ROLES;

const isClanManagerSetupInteraction = (interaction) =>
  (interaction.isMessageComponent() && [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID].includes(interaction.customId))
  || (interaction.isModalSubmit() && [ADD_MODAL_ID, REMOVE_MODAL_ID].includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const savedIds = async (guildId) => clans.managerRoleIds(await getGuildConfig(guildId));

function buildPanel(ids) {
  const list = ids.length ? ids.map((id) => `- <@&${id}>  ⁘`).join('\n') : '- __No manager roles configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${EMOJI.clan} Clan Manager`),
        divider(),
        textBlock(`- ${SETUP_EMOJI.dropdown} __Members with these roles (and Administrators) can create, edit and delete every clan (max ${MAX} roles).__  ⁘`),
        divider(),
        textBlock(`- __Current Manager Roles ${ids.length}/${MAX} :__  ⁘\n${list}`),
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Manager Add', custom_id: ADD_BUTTON_ID, disabled: ids.length >= MAX },
            { type: 2, style: 2, label: 'Manager Remove', custom_id: REMOVE_BUTTON_ID, disabled: ids.length === 0 },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

const buildAddModal = (remaining) => ({
  title: 'Add Clan Manager Roles',
  custom_id: ADD_MODAL_ID,
  components: [
    label('Roles', 'Members with these roles can manage every clan', {
      type: 6, custom_id: ADD_FIELD_ID, placeholder: 'Select roles', min_values: 1, max_values: remaining,
    }),
  ],
});

function buildRemoveModal(guild, ids) {
  const options = ids.map((id) => {
    const role = guild.roles.cache.get(id);
    return role
      ? { label: role.name.slice(0, 100), value: id }
      : { label: 'Deleted role', value: id, description: `ID: ${id}` };
  });
  return {
    title: 'Remove Clan Manager Roles',
    custom_id: REMOVE_MODAL_ID,
    components: [
      label('Roles to remove', 'Select the manager roles you want to remove', {
        type: 3, custom_id: REMOVE_FIELD_ID, placeholder: 'Select roles', min_values: 1, max_values: options.length, options,
      }),
    ],
  };
}

const refresh = (interaction, ids) => (interaction.isFromMessage()
  ? interaction.update(buildPanel(ids))
  : interaction.reply({ ...buildPanel(ids), flags: COMPONENTS_V2 | EPHEMERAL }));

async function handleAdd(interaction, ids) {
  const picked = [...interaction.fields.getSelectedRoles(ADD_FIELD_ID, true).keys()];
  const next = [...ids];
  const skipped = [];
  for (const id of picked) {
    const role = interaction.guild.roles.cache.get(id);
    if (!role) continue;
    if (role.id === interaction.guild.id) skipped.push({ role, reason: "@everyone can't be a clan manager role" });
    else if (next.includes(role.id)) skipped.push({ role, reason: 'already a manager role' });
    else if (next.length >= MAX) skipped.push({ role, reason: `limit of ${MAX} reached` });
    else {
      await clans.addManagerRole(interaction.guild.id, role.id);
      next.push(role.id);
    }
  }
  await refresh(interaction, next);
  if (skipped.length) {
    await interaction.followUp(notice(skipped.flatMap(({ role, reason }) => [`__Skipped__ : ${role}`, `__Reason__ : ${reason}`])));
  }
}

async function handleRemove(interaction, ids) {
  const toRemove = interaction.fields.getStringSelectValues(REMOVE_FIELD_ID);
  for (const id of toRemove) await clans.removeManagerRole(interaction.guild.id, id);
  await refresh(interaction, ids.filter((id) => !toRemove.includes(id)));
}

async function handleClanManagerSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change the clan manager roles__'));
  }
  const ids = await savedIds(interaction.guild.id);

  if (interaction.isModalSubmit()) {
    return interaction.customId === ADD_MODAL_ID ? handleAdd(interaction, ids) : handleRemove(interaction, ids);
  }
  if (interaction.customId === PANEL_BUTTON_ID) return interaction.reply({ ...buildPanel(ids), flags: COMPONENTS_V2 | EPHEMERAL });
  if (interaction.customId === ADD_BUTTON_ID) {
    if (ids.length >= MAX) return interaction.reply(notice(`__You already have ${MAX}/${MAX} manager roles - remove one first__`));
    return interaction.showModal(buildAddModal(MAX - ids.length));
  }
  if (!ids.length) return interaction.reply(notice('__There are no manager roles to remove__'));
  return interaction.showModal(buildRemoveModal(interaction.guild, ids));
}

module.exports = { isClanManagerSetupInteraction, handleClanManagerSetupInteraction };
