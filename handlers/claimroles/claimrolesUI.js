'use strict';
const { ACCENT_COLOR, COMPONENTS_V2, divider, textBlock, bullet } = require('../../utils/render/embeds');
const { CLAIMROLES_EMOJI, TICKET_EMOJI } = require('../../utils/emojis');

const MAX_CATEGORIES = 25;
const MAX_ROLES_PER_CATEGORY = 25;
const MAX_BUTTON_LABEL_LENGTH = 80;
const BUTTONS_PER_ROW = 5;

const BUTTON_PREFIX = 'claimroles_category_';
const EDIT_SELECT_PREFIX = 'claimroles_edit_select_';
const REMOVE_SELECT_PREFIX = 'claimroles_remove_select_';
const REMOVE_CONFIRM_PREFIX = 'claimroles_remove_confirm_';
const REMOVE_CANCEL_PREFIX = 'claimroles_remove_cancel_';
const ROLES_SELECT_PREFIX = 'claimroles_roles_';
const ROLE_BUTTON_PREFIX = 'claimroles_role_';
const ROLE_PICK_PREFIX = `${ROLE_BUTTON_PREFIX}pick_`;
const ROLE_CONFIRM_PREFIX = `${ROLE_BUTTON_PREFIX}confirm_`;
const ROLE_CANCEL_PREFIX = `${ROLE_BUTTON_PREFIX}cancel_`;
const SEND_PANEL_PREFIX = 'claimroles_send_panel_';
const TYPE_BUTTON_PREFIX = 'claimrolespanel_type_';
const PANEL_MODAL_PREFIX = 'claimrolespanel_modal_';
const CLAIM_SELECT_ID = 'claimroles_role_select_menu';
const CLAIM_BUTTON_PREFIX = 'claimroles_role_claim_';
const ROLE_ADD_MODAL_PREFIX = 'claimroles_role_add_modal_';
const ROLE_FIELD_ID = 'claimroles_role_select';
const ROLE_EMOJI_FIELD_ID = 'claimroles_role_emoji';
const NAME_FIELD_ID = 'claimroles_category_name';
const IMAGE_FIELD_ID = 'claimroles_category_image';
const PANEL_TYPE_FIELD_ID = 'claimrolespanel_interaction';
const PANEL_CATEGORIES_FIELD_ID = 'claimrolespanel_categories';
const PANEL_TITLE_FIELD_ID = 'claimrolespanel_title';
const PANEL_DESCRIPTION_FIELD_ID = 'claimrolespanel_description';
const PANEL_FOOTER_FIELD_ID = 'claimrolespanel_footer';

const inline = ({ name, id }) => `<:${name}:${id}>`;

function buttonEmoji(saved) {
  const custom = /^<(a?):(\w{2,32}):(\d{17,20})>$/.exec(saved);
  return custom ? { name: custom[2], id: custom[3], animated: custom[1] === 'a' } : { name: saved };
}

const spacer = () => ({ type: 14, spacing: 2, divider: true });

const textField = (label, customId, placeholder, required, maxLength, value, style = 1) => ({
  type: 18,
  label,
  component: { type: 4, custom_id: customId, style, placeholder, required, max_length: maxLength, ...(value && { value }) },
});

const buttonRows = (buttons) => Array.from({ length: Math.ceil(buttons.length / BUTTONS_PER_ROW) }, (_, i) => ({
  type: 1,
  components: buttons.slice(i * BUTTONS_PER_ROW, (i + 1) * BUTTONS_PER_ROW),
}));

const claimMenu = (options) => ({
  type: 1,
  components: [{
    type: 3,
    custom_id: CLAIM_SELECT_ID,
    placeholder: 'Select roles to claim',
    min_values: 0,
    max_values: options.length,
    options,
  }],
});

function containerPanel({ title, description, imageUrls, rows, footerLine }) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${title}`),
        ...(description ? [textBlock(description)] : []),
        ...(imageUrls.length ? [spacer(), { type: 12, items: imageUrls.map((url) => ({ media: { url } })) }] : []),
        spacer(),
        ...rows,
        spacer(),
        textBlock(footerLine),
      ],
      spoiler: false,
    }],
  };
}

function categoryPicker({ ownerId, list, icon, title, hint, prefix, dividedRows = false }) {
  const rows = [];
  for (let i = 0; i < list.length; i += BUTTONS_PER_ROW) {
    if (dividedRows && i > 0) rows.push(divider());
    rows.push({
      type: 1,
      components: list.slice(i, i + BUTTONS_PER_ROW).map((category) => ({
        type: 2,
        style: 2,
        label: category.name.slice(0, MAX_BUTTON_LABEL_LENGTH),
        ...(category.emoji && { emoji: category.emoji }),
        custom_id: `${prefix}${ownerId}_${category.id}`,
      })),
    });
  }

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${icon} ${title}`),
        divider(),
        textBlock(bullet(hint)),
        divider(),
        ...rows,
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function categoriesPanel(ownerId, list) {
  const empty = list.length === 0;
  const button = (action, label, emoji, disabled = false) => ({
    type: 2,
    style: 2,
    label,
    emoji,
    ...(disabled && { disabled }),
    custom_id: `${BUTTON_PREFIX}${action}_${ownerId}`,
  });

  const shown = empty
    ? bullet('__No categories created yet__')
    : list.map((category, i) => `**${i + 1}.** ${category.name} \`${category.id}\``).join('\n');

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${CLAIMROLES_EMOJI.header} Claim Roles Categories`),
        divider(),
        textBlock(bullet(`**Total Categories:** \`${list.length}/${MAX_CATEGORIES}\``)),
        divider(),
        textBlock(shown),
        divider(),
        {
          type: 1,
          components: [
            button('add', 'Add Category', CLAIMROLES_EMOJI.add),
            button('edit', 'Edit Category', CLAIMROLES_EMOJI.edit, empty),
            button('remove', 'Remove Category', CLAIMROLES_EMOJI.remove, empty),
          ],
        },
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function editSelectPanel(ownerId, list) {
  return categoryPicker({
    ownerId,
    list,
    icon: inline(CLAIMROLES_EMOJI.edit),
    title: 'Select Category to Edit',
    hint: '__Click a category to edit its name and image__',
    prefix: EDIT_SELECT_PREFIX,
  });
}

function removeSelectPanel(ownerId, list) {
  return categoryPicker({
    ownerId,
    list,
    icon: inline(CLAIMROLES_EMOJI.remove),
    title: 'Select Category to Remove',
    hint: '__Click a category to remove it__',
    prefix: REMOVE_SELECT_PREFIX,
  });
}

function rolesPanel(ownerId, list) {
  return categoryPicker({
    ownerId,
    list,
    icon: CLAIMROLES_EMOJI.header,
    title: 'Manage Roles',
    hint: '__Select a category to manage roles__',
    prefix: ROLES_SELECT_PREFIX,
    dividedRows: true,
  });
}

function removeConfirmPanel(ownerId, category) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${inline(CLAIMROLES_EMOJI.remove)} Remove Category`),
        divider(),
        textBlock(bullet(`__Are you sure you want to remove **${category.name}**?__`)),
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 3, label: 'Confirm', custom_id: `${REMOVE_CONFIRM_PREFIX}${ownerId}_${category.id}` },
            { type: 2, style: 4, label: 'Cancel', custom_id: `${REMOVE_CANCEL_PREFIX}${ownerId}_${category.id}` },
          ],
        },
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function categoryRolesPanel(ownerId, category) {
  const roles = category.roles || [];
  const empty = roles.length === 0;
  const button = (action, label, emoji, disabled = false) => ({
    type: 2,
    style: 2,
    label,
    emoji,
    ...(disabled && { disabled }),
    custom_id: `${ROLE_BUTTON_PREFIX}${action}_${ownerId}_${category.id}`,
  });

  const shown = empty
    ? bullet('__No roles added yet__')
    : roles.map((role, i) => `**${i + 1}.** ${role.emoji ? `${role.emoji} ` : ''}<@&${role.id}>`).join('\n');

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${category.name}`),
        divider(),
        textBlock(bullet(`**Total Roles:** \`${roles.length}/${MAX_ROLES_PER_CATEGORY}\``)),
        divider(),
        textBlock(shown),
        divider(),
        {
          type: 1,
          components: [
            button('add', 'Add Roles', CLAIMROLES_EMOJI.add),
            button('remove', 'Remove Roles', CLAIMROLES_EMOJI.remove, empty),
          ],
        },
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function roleRemoveSelectPanel(ownerId, category, roleName, withEmoji = true) {
  return categoryPicker({
    ownerId,
    list: (category.roles || []).map((role) => ({
      name: roleName(role.id),
      id: `${category.id}_${role.id}`,
      ...(withEmoji && role.emoji && { emoji: buttonEmoji(role.emoji) }),
    })),
    icon: inline(CLAIMROLES_EMOJI.remove),
    title: 'Select Role to Remove',
    hint: '__Click a role to remove it from the category__',
    prefix: ROLE_PICK_PREFIX,
    dividedRows: true,
  });
}

function roleRemoveConfirmPanel(ownerId, category, roleId) {
  const suffix = `${ownerId}_${category.id}_${roleId}`;
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${inline(CLAIMROLES_EMOJI.remove)} Remove Role`),
        divider(),
        textBlock(bullet(`__Are you sure you want to remove <@&${roleId}> from **${category.name}**?__`)),
        divider(),
        {
          type: 1,
          components: [
            { type: 2, style: 3, label: 'Confirm', custom_id: `${ROLE_CONFIRM_PREFIX}${suffix}` },
            { type: 2, style: 4, label: 'Cancel', custom_id: `${ROLE_CANCEL_PREFIX}${suffix}` },
          ],
        },
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function sendPanelPrompt(ownerId, list) {
  const shown = list.map((category, i) => `**${i + 1}.** ${category.name} - \`${(category.roles || []).length}\` roles`).join('\n');
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${CLAIMROLES_EMOJI.header} Send Claim Roles Panel`),
        divider(),
        textBlock(bullet('__Click the button below to configure and send the panel__')),
        divider(),
        textBlock(`${bullet('**Available Categories:**')}\n${shown}`),
        divider(),
        {
          type: 1,
          components: [{ type: 2, style: 2, label: 'Send Panel', custom_id: `${SEND_PANEL_PREFIX}${ownerId}` }],
        },
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function displayTypePrompt(ownerId) {
  const button = (label, display) => ({ type: 2, style: 2, label, custom_id: `${TYPE_BUTTON_PREFIX}${ownerId}_${display}` });
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      spoiler: false,
      components: [
        textBlock(`## ${CLAIMROLES_EMOJI.header} Select Display Type`),
        divider(),
        textBlock(bullet('__Choose how the panel should be displayed__')),
        divider(),
        textBlock([bullet('**Embed:** Classic embed display'), bullet('**Component V2:** Modern container-based display')].join('\n')),
        divider(),
        { type: 1, components: [button('Embed', 'embed'), button('Component V2', 'component')] },
      ],
      accent_color: ACCENT_COLOR,
    }],
  };
}

function buildCategoryModal({ title, customId, name, imageUrl }) {
  return {
    title,
    custom_id: customId,
    components: [
      textField('Category Name', NAME_FIELD_ID, 'e.g., Colors, Games, Notifications', true, 100, name),
      textField('Category Image URL (Optional)', IMAGE_FIELD_ID, 'https://example.com/image.png', false, 2048, imageUrl),
    ],
  };
}

function buildRoleModal(categoryId) {
  return {
    title: 'Add Role',
    custom_id: `${ROLE_ADD_MODAL_PREFIX}${categoryId}`,
    components: [
      {
        type: 18,
        label: 'Select Role',
        component: { type: 6, custom_id: ROLE_FIELD_ID, placeholder: 'Choose a role to add', min_values: 1, max_values: 1, required: true },
      },
      textField('Role Emoji (Optional)', ROLE_EMOJI_FIELD_ID, '🎭 or <:custom:123456789>', false, 64),
    ],
  };
}

function buildPanelModal(display, categories) {
  return {
    title: 'Claim Roles Panel',
    custom_id: `${PANEL_MODAL_PREFIX}${display}`,
    components: [
      {
        type: 18,
        label: 'Interaction Type',
        description: 'Choose how users will interact with categories',
        component: {
          type: 3,
          custom_id: PANEL_TYPE_FIELD_ID,
          placeholder: 'Select an interaction type',
          min_values: 1,
          max_values: 1,
          options: [
            { label: 'Buttons', value: 'buttons', description: 'One button per role' },
            { label: 'Select Menu', value: 'select_menu', description: 'A single dropdown with every role' },
          ],
        },
      },
      {
        type: 18,
        label: 'Categories',
        component: {
          type: 3,
          custom_id: PANEL_CATEGORIES_FIELD_ID,
          placeholder: 'Select categories to include',
          min_values: 1,
          max_values: categories.length,
          options: categories.map((category) => ({ label: category.name, value: category.id })),
        },
      },
      textField('Panel Title', PANEL_TITLE_FIELD_ID, 'Claim Your Roles', true, 256),
      textField('Panel Description (Optional)', PANEL_DESCRIPTION_FIELD_ID, 'Select your roles below', false, 1000, undefined, 2),
      textField('Panel Footer (Optional)', PANEL_FOOTER_FIELD_ID, 'e.g., React to claim roles', false, 2000),
    ],
  };
}

function claimEmbedPanel({ title, description, footer, imageUrls, options, buttons, botName }) {
  return {
    embeds: [{
      title,
      ...(description && { description }),
      color: ACCENT_COLOR,
      timestamp: new Date().toISOString(),
      ...(imageUrls.length && { image: { url: imageUrls[0] } }),
      footer: { text: `${botName} ༯ Roles${footer ? ` ${footer}` : ''}` },
    }],
    components: buttons ? buttonRows(buttons) : [claimMenu(options)],
  };
}

const claimPanel = ({ title, description, footer, imageUrls, options, botName }) => containerPanel({
  title,
  description,
  imageUrls,
  rows: [claimMenu(options)],
  footerLine: `-# ${TICKET_EMOJI.footer}  ༯  ${botName} - Roles${footer ? `  •  ${footer}` : ''}`,
});

const claimButtonPanel = ({ title, description, footer, imageUrls, buttons, botName }) => containerPanel({
  title,
  description,
  imageUrls,
  rows: buttonRows(buttons),
  footerLine: `-# ${TICKET_EMOJI.footer} ༯ ${botName} - Roles${footer ? `  •  ${footer}` : ''}`,
});

module.exports = {
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
};
