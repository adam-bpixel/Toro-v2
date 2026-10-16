'use strict';

// customIds, modal field IDs and limits shared by claimrolesUI.js (which builds the panels)
// and index.js (which handles them). Defined once so the two can never drift apart.
const MAX_CATEGORIES = 25;
const MAX_ROLES_PER_CATEGORY = 25;
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

module.exports = {
  MAX_CATEGORIES,
  MAX_ROLES_PER_CATEGORY,
  BUTTON_PREFIX,
  EDIT_SELECT_PREFIX,
  REMOVE_SELECT_PREFIX,
  REMOVE_CONFIRM_PREFIX,
  REMOVE_CANCEL_PREFIX,
  ROLES_SELECT_PREFIX,
  ROLE_BUTTON_PREFIX,
  ROLE_PICK_PREFIX,
  ROLE_CONFIRM_PREFIX,
  ROLE_CANCEL_PREFIX,
  SEND_PANEL_PREFIX,
  TYPE_BUTTON_PREFIX,
  PANEL_MODAL_PREFIX,
  CLAIM_SELECT_ID,
  ROLE_ADD_MODAL_PREFIX,
  ROLE_FIELD_ID,
  ROLE_EMOJI_FIELD_ID,
  NAME_FIELD_ID,
  IMAGE_FIELD_ID,
  PANEL_TYPE_FIELD_ID,
  PANEL_CATEGORIES_FIELD_ID,
  PANEL_TITLE_FIELD_ID,
  PANEL_DESCRIPTION_FIELD_ID,
  PANEL_FOOTER_FIELD_ID,
};
