'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { SETUP_EMOJI } = require('../../utils/emojis');

const EPHEMERAL = 1 << 6;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 10;
const PANEL_BUTTON_ID = 'setup_autotag_1398395532103254157';
const ADD_BUTTON_ID = 'setup_add_autotag_1398395532103254157';
const REMOVE_BUTTON_ID = 'setup_remove_autotag_1398395532103254157';
const ADD_MODAL_ID = 'autotag_add_modal';
const REMOVE_MODAL_ID = 'autotag_remove_modal';
const ROLE_FIELD_ID = 'autotag_add_role';
const TAG_FIELD_ID = 'autotag_add_tag';
const POSITION_FIELD_ID = 'autotag_add_position';
const REMOVE_FIELD_ID = 'autotag_remove_tags';

const BUTTON_IDS = [PANEL_BUTTON_ID, ADD_BUTTON_ID, REMOVE_BUTTON_ID];
const MODAL_IDS = [ADD_MODAL_ID, REMOVE_MODAL_ID];

const isAutotagInteraction = (interaction) =>
  (interaction.isMessageComponent() && BUTTON_IDS.includes(interaction.customId)) ||
  (interaction.isModalSubmit() && MODAL_IDS.includes(interaction.customId));

const label = (text, description, component) => ({ type: 18, label: text, description, component });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

const savedTags = (config) => (Array.isArray(config.autoTags) ? config.autoTags : []);
const show = (entry) => (entry.position === 'end' ? `name ${entry.tag}` : `${entry.tag} name`);

function buildPanel(tags) {
  const list = tags.length ? tags.map((entry) => `- <@&${entry.roleId}> ➜ \`${show(entry)}\`  ⁘`).join('\n') : '- __No autotags configured__  ⁘';
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${SETUP_EMOJI.param} Auto Tag` },
        divider(),
        { type: 10, content: `- ${SETUP_EMOJI.dropdown} __Configure Auto Tag settings. Use the buttons below to add or remove tags (max ${MAX_TAGS}).__  ⁘` },
        divider(),
        { type: 10, content: `- __Current Autotags ${tags.length}/${MAX_TAGS} :__  ⁘\n${list}` },
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 2, label: 'Auto Tag Add', custom_id: ADD_BUTTON_ID, disabled: tags.length >= MAX_TAGS },
            { type: 2, style: 2, label: 'Auto Tag Remove', custom_id: REMOVE_BUTTON_ID, disabled: tags.length === 0 },
          ],
        },
      ],
      spoiler: false,
    }],
  };
}

const buildAddModal = () => ({
  title: 'Add Auto Tag',
  custom_id: ADD_MODAL_ID,
  components: [
    label('Role', 'Members with this role get the tag', { type: 6, custom_id: ROLE_FIELD_ID, placeholder: 'Select a role', min_values: 1, max_values: 1 }),
    label('Tag', `Up to ${MAX_TAG_LENGTH} characters`, { type: 4, custom_id: TAG_FIELD_ID, style: 1, min_length: 1, max_length: MAX_TAG_LENGTH, placeholder: 'e.g. [VIP]', required: true }),
    label('Position', 'Where the tag goes in the name', {
      type: 3,
      custom_id: POSITION_FIELD_ID,
      placeholder: 'Start or end',
      min_values: 1,
      max_values: 1,
      options: [
        { label: 'Start', value: 'start', description: 'Tag name' },
        { label: 'End', value: 'end', description: 'name Tag' },
      ],
    }),
  ],
});

function buildRemoveModal(guild, tags) {
  return {
    title: 'Remove Auto Tags',
    custom_id: REMOVE_MODAL_ID,
    components: [
      label('Tags to remove', 'Select the auto tags you want to remove', {
        type: 3,
        custom_id: REMOVE_FIELD_ID,
        placeholder: 'Select tags',
        min_values: 1,
        max_values: tags.length,
        options: tags.map((entry) => {
          const role = guild.roles.cache.get(entry.roleId);
          return { label: (role?.name || 'Deleted role').slice(0, 100), value: entry.roleId, description: show(entry).slice(0, 100) };
        }),
      }),
    ],
  };
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  await interaction.reply(notice('__You need the Administrator permission to change auto tags__'));
  return false;
}

const refreshPanel = (interaction, tags) =>
  interaction.isFromMessage()
    ? interaction.update(buildPanel(tags))
    : interaction.reply({ ...buildPanel(tags), flags: COMPONENTS_V2 | EPHEMERAL });


function wantedNickname(member, tags) {
  const current = member.nickname ?? member.user.displayName;
  let base = current;
  for (const { tag } of tags) {
    if (base.startsWith(`${tag} `)) base = base.slice(tag.length + 1);
    if (base.endsWith(` ${tag}`)) base = base.slice(0, -(tag.length + 1));
  }
  const entry = tags.find((item) => member.roles.cache.has(item.roleId));
  if (!entry) return base === member.user.displayName ? null : base;
  const room = 32 - entry.tag.length - 1;
  const name = base.slice(0, room);
  return entry.position === 'end' ? `${name} ${entry.tag}` : `${entry.tag} ${name}`;
}

async function updateMemberTag(member) {
  if (member.user.bot || !member.manageable) return;
  const tags = savedTags(await getGuildConfig(member.guild.id));
  if (!tags.length) return;
  const next = wantedNickname(member, tags);
  if ((next ?? null) === (member.nickname ?? null)) return;
  await member.setNickname(next, 'Auto tag');
}

const stripTag = (name, tag) => (name.startsWith(`${tag} `) ? name.slice(tag.length + 1) : name.endsWith(` ${tag}`) ? name.slice(0, -(tag.length + 1)) : name);
const applyTag = (name, entry) => {
  const room = 32 - entry.tag.length - 1;
  const base = stripTag(name, entry.tag).slice(0, room);
  return entry.position === 'end' ? `${base} ${entry.tag}` : `${entry.tag} ${base}`;
};

async function syncMemberOnRoleChange(oldMember, newMember) {
  if (newMember.user.bot || !newMember.manageable) return;
  const tags = savedTags(await getGuildConfig(newMember.guild.id));
  if (!tags.length) return;
  const before = oldMember.roles.cache;
  const after = newMember.roles.cache;
  const lost = tags.filter((entry) => before.has(entry.roleId) && !after.has(entry.roleId));
  const gained = tags.filter((entry) => !before.has(entry.roleId) && after.has(entry.roleId));
  if (!lost.length && !gained.length) return;

  let name = newMember.nickname ?? newMember.user.displayName;
  for (const entry of lost) name = stripTag(name, entry.tag);
  for (const entry of gained) name = applyTag(name, entry);
  const next = name === newMember.user.displayName ? null : name;
  if ((next ?? null) === (newMember.nickname ?? null)) return;
  await newMember.setNickname(next, 'Auto tag');
}


async function handleAdd(interaction, tags) {
  const { guild } = interaction;
  const roleId = [...interaction.fields.getSelectedRoles(ROLE_FIELD_ID, true).keys()][0];
  const tag = interaction.fields.getTextInputValue(TAG_FIELD_ID).trim();
  const position = interaction.fields.getStringSelectValues(POSITION_FIELD_ID)[0] === 'end' ? 'end' : 'start';
  const role = guild.roles.cache.get(roleId);

  let reason = null;
  if (!role) reason = 'role not found';
  else if (!tag || tag.length > MAX_TAG_LENGTH) reason = `the tag must be 1-${MAX_TAG_LENGTH} characters`;
  else if (role.id === guild.id) reason = "@everyone can't have a tag";
  else if (tags.some((entry) => entry.roleId === role.id)) reason = 'that role already has a tag';
  else if (tags.some((entry) => entry.tag === tag)) reason = 'that tag is already used';
  else if (tags.length >= MAX_TAGS) reason = `limit of ${MAX_TAGS} reached`;
  if (reason) return interaction.reply(notice([`__Skipped__ : ${role ?? 'role'}`, `__Reason__ : ${reason}`]));

  const next = [...tags, { roleId: role.id, tag, position }];
  await updateGuildConfig(guild.id, { $set: { autoTags: next } });
  await refreshPanel(interaction, next);
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    await interaction.followUp(notice('__I need the Manage Nicknames permission to put tags on names__'));
  }
}

async function handleRemove(interaction, tags) {
  const { guild } = interaction;
  const drop = interaction.fields.getStringSelectValues(REMOVE_FIELD_ID);
  const next = tags.filter((entry) => !drop.includes(entry.roleId));
  await updateGuildConfig(guild.id, { $set: { autoTags: next } });
  await refreshPanel(interaction, next);
  const removed = tags.filter((entry) => drop.includes(entry.roleId));
  for (const entry of removed) {
    const role = guild.roles.cache.get(entry.roleId);
    for (const member of role?.members.values() ?? []) {
      const nick = member.nickname;
      if (!nick || !member.manageable) continue;
      const stripped = nick.startsWith(`${entry.tag} `) ? nick.slice(entry.tag.length + 1) : nick.endsWith(` ${entry.tag}`) ? nick.slice(0, -(entry.tag.length + 1)) : nick;
      if (stripped !== nick) await member.setNickname(stripped === member.user.displayName ? null : stripped, 'Auto tag removed').catch(() => {});
    }
  }
}

async function handleAutotagInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!(await requireManager(interaction))) return;

  const tags = savedTags(await getGuildConfig(interaction.guild.id));

  if (interaction.isModalSubmit()) {
    return interaction.customId === ADD_MODAL_ID ? handleAdd(interaction, tags) : handleRemove(interaction, tags);
  }
  if (interaction.customId === PANEL_BUTTON_ID) {
    return interaction.reply({ ...buildPanel(tags), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (interaction.customId === ADD_BUTTON_ID) {
    if (tags.length >= MAX_TAGS) return interaction.reply(notice(`__You already have ${MAX_TAGS}/${MAX_TAGS} auto tags - remove one first__`));
    return interaction.showModal(buildAddModal());
  }
  if (!tags.length) return interaction.reply(notice('__There are no auto tags to remove__'));
  return interaction.showModal(buildRemoveModal(interaction.guild, tags));
}

module.exports = { isAutotagInteraction, handleAutotagInteraction, updateMemberTag, syncMemberOnRoleChange };
