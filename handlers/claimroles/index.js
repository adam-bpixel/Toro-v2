'use strict';
const crypto = require('node:crypto');
const { MessageFlags, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const {
  getClaimCategories, addClaimCategory, updateClaimCategory, removeClaimCategory, addClaimRole, removeClaimRole,
  getGuildConfig, patchClaimPanel,
} = require('../../models/core/moderation');
const { payloadOf, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const {
  buttonEmoji,
  categoriesPanel,
  editSelectPanel,
  removeSelectPanel,
  removeConfirmPanel,
  rolesPanel,
  categoryRolesPanel,
  roleRemoveSelectPanel,
  roleRemoveConfirmPanel,
  sendPanelPrompt,
  displayTypePrompt,
  buildCategoryModal,
  buildRoleModal,
  buildPanelModal,
  claimEmbedPanel,
  claimPanel,
  claimButtonPanel,
} = require('./claimrolesUI');
const {
  DANGEROUS_PERMISSIONS,
  executeRoleAssignment,
} = require('./claimrolesService');

const MAX_CATEGORIES = 25;
const MAX_NAME_LENGTH = 100;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_PANEL_ROLES = 25;
const MAX_PANEL_IMAGES = 10;
const MAX_ROLES_PER_CATEGORY = 25;

const BUTTON_PREFIX = 'claimroles_category_';
const ADD_BUTTON_PREFIX = `${BUTTON_PREFIX}add_`;
const EDIT_BUTTON_PREFIX = `${BUTTON_PREFIX}edit_`;
const REMOVE_BUTTON_PREFIX = `${BUTTON_PREFIX}remove_`;
const EDIT_SELECT_PREFIX = 'claimroles_edit_select_';
const REMOVE_SELECT_PREFIX = 'claimroles_remove_select_';
const REMOVE_CONFIRM_PREFIX = 'claimroles_remove_confirm_';
const REMOVE_CANCEL_PREFIX = 'claimroles_remove_cancel_';
const ROLES_SELECT_PREFIX = 'claimroles_roles_';
const ROLE_BUTTON_PREFIX = 'claimroles_role_';
const ROLE_ADD_PREFIX = `${ROLE_BUTTON_PREFIX}add_`;
const ROLE_REMOVE_PREFIX = `${ROLE_BUTTON_PREFIX}remove_`;
const ROLE_PICK_PREFIX = `${ROLE_BUTTON_PREFIX}pick_`;
const ROLE_CONFIRM_PREFIX = `${ROLE_BUTTON_PREFIX}confirm_`;
const ROLE_CANCEL_PREFIX = `${ROLE_BUTTON_PREFIX}cancel_`;
const SEND_PANEL_PREFIX = 'claimroles_send_panel_';
const TYPE_BUTTON_PREFIX = 'claimrolespanel_type_';
const PANEL_MODAL_PREFIX = 'claimrolespanel_modal_';
const DISPLAY_TYPES = ['embed', 'component'];
const PANEL_TYPE_FIELD_ID = 'claimrolespanel_interaction';
const PANEL_CATEGORIES_FIELD_ID = 'claimrolespanel_categories';
const PANEL_TITLE_FIELD_ID = 'claimrolespanel_title';
const PANEL_DESCRIPTION_FIELD_ID = 'claimrolespanel_description';
const PANEL_FOOTER_FIELD_ID = 'claimrolespanel_footer';
const CLAIM_SELECT_ID = 'claimroles_role_select_menu';
const CLAIM_BUTTON_PREFIX = 'claimroles_role_claim_';
const ROLE_ADD_MODAL_PREFIX = 'claimroles_role_add_modal_';
const ROLE_FIELD_ID = 'claimroles_role_select';
const ROLE_EMOJI_FIELD_ID = 'claimroles_role_emoji';
const ADD_MODAL_ID = 'claimroles_category_add_modal';
const EDIT_MODAL_PREFIX = 'claimroles_edit_modal_';
const NAME_FIELD_ID = 'claimroles_category_name';
const IMAGE_FIELD_ID = 'claimroles_category_image';

const INVALID_FORM_BODY = 50035;
const NO_ACCESS_CODES = [50001, 50013];
const NO_CATEGORIES = '__No categories created yet - add one with /claimroles categories first__';

const CUSTOM_EMOJI = /^<a?:\w{2,32}:\d{17,20}>$/;
const UNICODE_EMOJI = /^(?:\p{Regional_Indicator}{2}|[0-9#*]️?⃣|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic})*)$/u;

const BUTTON_ID_PREFIXES = [
  BUTTON_PREFIX, EDIT_SELECT_PREFIX, REMOVE_SELECT_PREFIX, REMOVE_CONFIRM_PREFIX, REMOVE_CANCEL_PREFIX, ROLES_SELECT_PREFIX,
  ROLE_BUTTON_PREFIX, SEND_PANEL_PREFIX, TYPE_BUTTON_PREFIX,
];

const isClaimrolesInteraction = (interaction) =>
  (interaction.isButton() && BUTTON_ID_PREFIXES.some((prefix) => interaction.customId.startsWith(prefix))) ||
  (interaction.isModalSubmit() && (
    interaction.customId === ADD_MODAL_ID ||
    interaction.customId.startsWith(PANEL_MODAL_PREFIX) ||
    interaction.customId.startsWith(EDIT_MODAL_PREFIX) ||
    interaction.customId.startsWith(ROLE_ADD_MODAL_PREFIX)
  )) ||
  (interaction.isStringSelectMenu() && interaction.customId === CLAIM_SELECT_ID);

const privately = (payload) => ({ ...payload, flags: COMPONENTS_V2 | MessageFlags.Ephemeral });
const notice = (lines) => privately(payloadOf({ title: 'Notice', lines: Array.isArray(lines) ? lines : [lines] }));
const noticeInPlace = (lines) => payloadOf({ title: 'Notice', lines: Array.isArray(lines) ? lines : [lines] });
const notSetUp = (interaction) => interaction.reply(notice('__This command is not set up yet__'));

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();
const noLongerExists = (interaction) => interaction.reply(notice('__That category no longer exists__'));
const refresh = (interaction, payload) =>
  interaction.isFromMessage() ? interaction.update(payload) : interaction.reply(privately(payload));

function isWebUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

async function requireManager(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  await interaction.reply(notice('__You need the Manage Server permission to change claim roles__'));
  return false;
}

function panelRoles(guild, categories) {
  const seen = new Set();
  const roles = [];
  for (const category of categories) {
    for (const { id, emoji } of category.roles || []) {
      const role = guild.roles.cache.get(id);
      if (!role || seen.has(id)) continue;
      seen.add(id);
      roles.push({ role, emoji, category });
    }
  }
  return roles;
}

const panelOptions = (roles, withEmoji = true) => roles.map(({ role, emoji, category }) => ({
  label: role.name.slice(0, MAX_NAME_LENGTH),
  value: role.id,
  description: category.name.slice(0, MAX_NAME_LENGTH),
  ...(withEmoji && emoji && { emoji: buttonEmoji(emoji) }),
}));

const panelButtons = (roles, withEmoji = true) => roles.map(({ role, emoji, category }) => ({
  type: 2,
  custom_id: `${CLAIM_BUTTON_PREFIX}${category.id}_${role.id}`,
  style: 2,
  label: role.name.slice(0, 80),
  ...(withEmoji && emoji && { emoji: buttonEmoji(emoji) }),
}));

function readCategoryFields(interaction) {
  const name = interaction.fields.getTextInputValue(NAME_FIELD_ID).trim();
  const imageUrl = interaction.fields.getTextInputValue(IMAGE_FIELD_ID).trim();

  if (!name) return { error: '__Please give the category a name__' };
  if (name.length > MAX_NAME_LENGTH) return { error: `__Category names can be at most ${MAX_NAME_LENGTH} characters__` };
  if (imageUrl && (imageUrl.length > MAX_IMAGE_URL_LENGTH || !isWebUrl(imageUrl))) {
    return { error: "__That image URL isn't valid - use a link starting with http:// or https://__" };
  }
  return { name, imageUrl: imageUrl || null };
}

function readRoleEmoji(raw) {
  const value = (raw ?? '').trim();
  if (!value) return { value: null };
  if (CUSTOM_EMOJI.test(value) || UNICODE_EMOJI.test(value)) return { value };
  return { error: "__That emoji isn't valid - send a single emoji, like 🎭 or a custom emoji from this server__" };
}

function roleRejection(interaction, role, category) {
  const { guild } = interaction;
  if ((category.roles || []).some((entry) => entry.id === role.id)) return 'already in this category';
  if (role.id === guild.id) return "@everyone can't be assigned";
  if (role.managed) return 'managed by an integration or bot';
  if (role.position >= guild.members.me.roles.highest.position) return 'above my highest role';
  const isGuildOwner = guild.ownerId === interaction.user.id;
  if (!isGuildOwner && role.position >= (interaction.member?.roles?.highest?.position ?? 0)) return 'above your highest role';
  return null;
}

const roleTarget = (customId) => {
  const [, , , , categoryId, roleId] = customId.split('_');
  return { categoryId, roleId };
};
const hasRole = (category, roleId) => Boolean(category) && (category.roles || []).some((role) => role.id === roleId);
const roleNoLongerThere = (interaction) => interaction.reply(notice('__That role is no longer in this category__'));

async function showCategories(interaction) {
  if (!interaction.inGuild()) return interaction.reply(notice('__This command can only be used in a server__'));
  const list = await getClaimCategories(interaction.guildId);
  return interaction.reply(categoriesPanel(interaction.user.id, list));
}

async function showPanel(interaction) {
  if (!interaction.inGuild()) return interaction.reply(notice('__This command can only be used in a server__'));
  const list = await getClaimCategories(interaction.guildId);
  if (!list.length) return interaction.reply(notice(NO_CATEGORIES));
  return interaction.reply(sendPanelPrompt(interaction.user.id, list));
}

async function showRoles(interaction) {
  if (!interaction.inGuild()) return interaction.reply(notice('__This command can only be used in a server__'));
  const list = await getClaimCategories(interaction.guildId);
  if (!list.length) return interaction.reply(notice(NO_CATEGORIES));
  return interaction.reply(rolesPanel(interaction.user.id, list));
}

async function showDisplayType(interaction) {
  if (!(await getClaimCategories(interaction.guildId)).length) return interaction.reply(notice(NO_CATEGORIES));
  return interaction.reply(privately(displayTypePrompt(interaction.user.id)));
}

async function openPanelModal(interaction) {
  const display = interaction.customId.split('_').pop();
  if (!DISPLAY_TYPES.includes(display)) return notSetUp(interaction);
  const list = await getClaimCategories(interaction.guildId);
  if (!list.length) return interaction.reply(notice(NO_CATEGORIES));
  return interaction.showModal(buildPanelModal(display, list));
}

async function showEditSelect(interaction) {
  const list = await getClaimCategories(interaction.guildId);
  if (!list.length) return interaction.reply(notice('__There are no categories to edit__'));
  return interaction.reply(privately(editSelectPanel(interaction.user.id, list)));
}

async function openEditModal(interaction) {
  const categoryId = interaction.customId.split('_').pop();
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);
  return interaction.showModal(buildCategoryModal({
    title: 'Edit Category',
    customId: `${EDIT_MODAL_PREFIX}${category.id}`,
    name: category.name,
    imageUrl: category.imageUrl,
  }));
}

async function showRemoveSelect(interaction) {
  const list = await getClaimCategories(interaction.guildId);
  if (!list.length) return interaction.reply(notice('__There are no categories to remove__'));
  return interaction.reply(privately(removeSelectPanel(interaction.user.id, list)));
}

async function askToConfirmRemoval(interaction) {
  const categoryId = interaction.customId.split('_').pop();
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);
  return interaction.reply(privately(removeConfirmPanel(interaction.user.id, category)));
}

async function confirmRemoval(interaction) {
  const categoryId = interaction.customId.split('_').pop();
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category || !(await removeClaimCategory(interaction.guildId, categoryId))) {
    return interaction.update(noticeInPlace('__That category no longer exists__'));
  }
  return interaction.update(noticeInPlace(`__Removed category **${category.name}**__`));
}

const cancelRemoval = (interaction) => interaction.update(noticeInPlace('__Cancelled - the category was not removed__'));

async function showCategoryRoles(interaction) {
  const categoryId = interaction.customId.split('_').pop();
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);
  return interaction.reply(privately(categoryRolesPanel(interaction.user.id, category)));
}

async function openRoleAddModal(interaction) {
  const categoryId = interaction.customId.split('_').pop();
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);
  if ((category.roles || []).length >= MAX_ROLES_PER_CATEGORY) {
    return interaction.reply(notice(`__**${category.name}** already has ${MAX_ROLES_PER_CATEGORY}/${MAX_ROLES_PER_CATEGORY} roles - remove one first__`));
  }
  return interaction.showModal(buildRoleModal(category.id));
}

async function showRoleRemoveSelect(interaction) {
  const categoryId = interaction.customId.split('_').pop();
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);
  if (!(category.roles || []).length) return interaction.reply(notice('__There are no roles to remove__'));
  const roleName = (roleId) => interaction.guild?.roles.cache.get(roleId)?.name ?? `Deleted role (${roleId})`;
  try {
    return await interaction.reply(privately(roleRemoveSelectPanel(interaction.user.id, category, roleName)));
  } catch (error) {
    if (error?.code !== INVALID_FORM_BODY) throw error;
    return interaction.reply(privately(roleRemoveSelectPanel(interaction.user.id, category, roleName, false)));
  }
}

async function askToConfirmRoleRemoval(interaction) {
  const { categoryId, roleId } = roleTarget(interaction.customId);
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);
  if (!hasRole(category, roleId)) return roleNoLongerThere(interaction);
  return interaction.reply(privately(roleRemoveConfirmPanel(interaction.user.id, category, roleId)));
}

async function confirmRoleRemoval(interaction) {
  const { categoryId, roleId } = roleTarget(interaction.customId);
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!hasRole(category, roleId) || !(await removeClaimRole(interaction.guildId, categoryId, roleId))) {
    return interaction.update(noticeInPlace('__That role is no longer in this category__'));
  }
  return interaction.update(noticeInPlace(`__Removed <@&${roleId}> from **${category.name}**__`));
}

const cancelRoleRemoval = (interaction) => interaction.update(noticeInPlace('__Cancelled - the role was not removed__'));

async function handleAddSubmit(interaction) {
  const input = readCategoryFields(interaction);
  if (input.error) return interaction.reply(notice(input.error));

  const existing = await getClaimCategories(interaction.guildId);
  if (existing.some((category) => sameName(category.name, input.name))) {
    return interaction.reply(notice(`__A category named **${input.name}** already exists__`));
  }

  const category = { id: crypto.randomBytes(8).toString('hex'), name: input.name, imageUrl: input.imageUrl, roles: [] };
  if (!(await addClaimCategory(interaction.guildId, category, MAX_CATEGORIES))) {
    return interaction.reply(notice(`__You already have ${MAX_CATEGORIES}/${MAX_CATEGORIES} categories - remove one first__`));
  }
  return refresh(interaction, categoriesPanel(interaction.user.id, [...existing, category]));
}

async function handleEditSubmit(interaction) {
  const categoryId = interaction.customId.slice(EDIT_MODAL_PREFIX.length);
  const input = readCategoryFields(interaction);
  if (input.error) return interaction.reply(notice(input.error));

  const existing = await getClaimCategories(interaction.guildId);
  if (!existing.some((category) => category.id === categoryId)) return noLongerExists(interaction);
  if (existing.some((category) => category.id !== categoryId && sameName(category.name, input.name))) {
    return interaction.reply(notice(`__A category named **${input.name}** already exists__`));
  }

  if (!(await updateClaimCategory(interaction.guildId, categoryId, input))) return noLongerExists(interaction);
  const list = existing.map((category) => (category.id === categoryId ? { ...category, ...input } : category));
  await refresh(interaction, editSelectPanel(interaction.user.id, list));
  await interaction.followUp(notice(`__Updated category **${input.name}**__`));
}

async function handleRoleAddSubmit(interaction) {
  const categoryId = interaction.customId.slice(ROLE_ADD_MODAL_PREFIX.length);
  const role = interaction.fields.getSelectedRoles(ROLE_FIELD_ID, true).first();
  const emoji = readRoleEmoji(interaction.fields.getTextInputValue(ROLE_EMOJI_FIELD_ID));
  if (emoji.error) return interaction.reply(notice(emoji.error));

  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  if (!category) return noLongerExists(interaction);

  if (new PermissionsBitField(role.permissions).any(DANGEROUS_PERMISSIONS, false)) {
    return interaction.reply(notice('__Cannot add dangerous roles with elevated permissions__'));
  }
  const reason = roleRejection(interaction, role, category);
  if (reason) return interaction.reply(notice([`__Skipped__ : <@&${role.id}>`, `__Reason__ : ${reason}`]));

  const entry = { id: role.id, emoji: emoji.value };
  const roles = category.roles || [];
  if (roles.length >= MAX_ROLES_PER_CATEGORY || !(await addClaimRole(interaction.guildId, categoryId, entry, MAX_ROLES_PER_CATEGORY))) {
    return interaction.reply(notice(`__Couldn't add that role - **${category.name}** is full or was just changed, please try again__`));
  }
  return refresh(interaction, categoryRolesPanel(interaction.user.id, { ...category, roles: [...roles, entry] }));
}

async function handlePanelSubmit(interaction) {
  const display = interaction.customId.slice(PANEL_MODAL_PREFIX.length);
  const [interactionType] = interaction.fields.getStringSelectValues(PANEL_TYPE_FIELD_ID);
  const withButtons = interactionType === 'buttons';
  if (!DISPLAY_TYPES.includes(display) || !(withButtons || interactionType === 'select_menu')) return notSetUp(interaction);
  const buildPanel = display === 'embed' ? claimEmbedPanel : (withButtons ? claimButtonPanel : claimPanel);

  const title = interaction.fields.getTextInputValue(PANEL_TITLE_FIELD_ID).trim();
  if (!title) return interaction.reply(notice('__Please give the panel a title__'));
  const description = interaction.fields.getTextInputValue(PANEL_DESCRIPTION_FIELD_ID).trim();
  const footer = interaction.fields.getTextInputValue(PANEL_FOOTER_FIELD_ID).trim();

  const saved = await getClaimCategories(interaction.guildId);
  const chosen = interaction.fields
    .getStringSelectValues(PANEL_CATEGORIES_FIELD_ID)
    .map((id) => saved.find((category) => category.id === id))
    .filter(Boolean);
  if (!chosen.length) return interaction.reply(notice('__The selected categories no longer exist__'));

  const roles = panelRoles(interaction.guild, chosen);
  if (!roles.length) return interaction.reply(notice('__The selected categories have no roles yet - add some with /claimroles roles first__'));
  if (roles.length > MAX_PANEL_ROLES) {
    return interaction.reply(notice(`__The selected categories hold ${roles.length} roles and a panel fits ${MAX_PANEL_ROLES} - pick fewer categories__`));
  }
  const imageUrls = [...new Set(chosen.map((category) => category.imageUrl).filter(Boolean))].slice(0, MAX_PANEL_IMAGES);

  await interaction.deferUpdate();
  const previous = await getGuildConfig(interaction.guildId);
  for (const withEmoji of [true, false]) {
    const controls = withButtons ? { buttons: panelButtons(roles, withEmoji) } : { options: panelOptions(roles, withEmoji) };
    try {
      const sent = await interaction.channel.send({ ...buildPanel({ title, description, footer, imageUrls, botName: interaction.guild.members.me?.displayName || interaction.client.user.displayName, ...controls }), allowedMentions: { parse: [] } });
      await disablePanelMessage(interaction.guild, previous.claimPanelChannelId, previous.claimPanelMessageId);
      await patchClaimPanel(interaction.guildId, { channelId: interaction.channel.id, messageId: sent.id });
      return;
    } catch (error) {
      if (NO_ACCESS_CODES.includes(error?.code)) return interaction.followUp(notice("__I can't send messages in this channel__"));
      if (error?.code !== INVALID_FORM_BODY) throw error;
    }
  }
  return interaction.followUp(notice('__Discord refused the panel - check the category image links and the role emoji__'));
}

async function claimFromPanel(interaction) {
  if (!interaction.values.length) return interaction.deferUpdate();
  const categories = await getClaimCategories(interaction.guildId);
  const claimable = new Set(categories.flatMap((category) => (category.roles || []).map((role) => role.id)));
  return executeRoleAssignment(interaction, interaction.values, claimable, notice);
}

async function claimFromButton(interaction) {
  const [categoryId, roleId] = interaction.customId.slice(CLAIM_BUTTON_PREFIX.length).split('_');
  const category = (await getClaimCategories(interaction.guildId)).find((c) => c.id === categoryId);
  return executeRoleAssignment(interaction, [roleId], new Set((category?.roles || []).map((role) => role.id)), notice);
}

async function handleClaimrolesInteraction(interaction) {
  if (!interaction.inGuild()) return;
  if (interaction.isStringSelectMenu()) return claimFromPanel(interaction);
  if (interaction.isButton() && interaction.customId.startsWith(CLAIM_BUTTON_PREFIX)) return claimFromButton(interaction);
  if (!(await requireManager(interaction))) return;

  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith(PANEL_MODAL_PREFIX)) return handlePanelSubmit(interaction);
    if (interaction.customId === ADD_MODAL_ID) return handleAddSubmit(interaction);
    if (interaction.customId.startsWith(ROLE_ADD_MODAL_PREFIX)) return handleRoleAddSubmit(interaction);
    return handleEditSubmit(interaction);
  }

  const { customId } = interaction;
  if (customId.startsWith(ADD_BUTTON_PREFIX)) {
    const existing = await getClaimCategories(interaction.guildId);
    if (existing.length >= MAX_CATEGORIES) {
      return interaction.reply(notice(`__You already have ${MAX_CATEGORIES}/${MAX_CATEGORIES} categories - remove one first__`));
    }
    return interaction.showModal(buildCategoryModal({ title: 'Add Category', customId: ADD_MODAL_ID }));
  }
  if (customId.startsWith(EDIT_BUTTON_PREFIX)) return showEditSelect(interaction);
  if (customId.startsWith(EDIT_SELECT_PREFIX)) return openEditModal(interaction);
  if (customId.startsWith(REMOVE_BUTTON_PREFIX)) return showRemoveSelect(interaction);
  if (customId.startsWith(REMOVE_SELECT_PREFIX)) return askToConfirmRemoval(interaction);
  if (customId.startsWith(REMOVE_CONFIRM_PREFIX)) return confirmRemoval(interaction);
  if (customId.startsWith(REMOVE_CANCEL_PREFIX)) return cancelRemoval(interaction);
  if (customId.startsWith(ROLES_SELECT_PREFIX)) return showCategoryRoles(interaction);
  if (customId.startsWith(ROLE_ADD_PREFIX)) return openRoleAddModal(interaction);
  if (customId.startsWith(ROLE_REMOVE_PREFIX)) return showRoleRemoveSelect(interaction);
  if (customId.startsWith(ROLE_PICK_PREFIX)) return askToConfirmRoleRemoval(interaction);
  if (customId.startsWith(ROLE_CONFIRM_PREFIX)) return confirmRoleRemoval(interaction);
  if (customId.startsWith(ROLE_CANCEL_PREFIX)) return cancelRoleRemoval(interaction);
  if (customId.startsWith(SEND_PANEL_PREFIX)) return showDisplayType(interaction);
  if (customId.startsWith(TYPE_BUTTON_PREFIX)) return openPanelModal(interaction);
  return notSetUp(interaction);
}

module.exports = {
  DANGEROUS_PERMISSIONS,
  categoriesPanel,
  editSelectPanel,
  removeSelectPanel,
  removeConfirmPanel,
  rolesPanel,
  categoryRolesPanel,
  roleRemoveSelectPanel,
  roleRemoveConfirmPanel,
  sendPanelPrompt,
  displayTypePrompt,
  buildPanelModal,
  claimPanel,
  claimButtonPanel,
  claimEmbedPanel,
  notSetUp,
  showCategories,
  showPanel,
  showRoles,
  isClaimrolesInteraction,
  handleClaimrolesInteraction,
};
