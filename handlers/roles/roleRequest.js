'use strict';
const crypto = require('node:crypto');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getRoleRequestConfig, updateGuildConfig } = require('../../models/core/moderation');
const { container, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { ROLE_REQUEST_EMOJI: E, TICKET_EMOJI } = require('../../utils/emojis');
const { rehostImage } = require('../../services/imageHost');
const { parseEmoji } = require('../tickets/ticketUI');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const { OPEN_COLOR, CLOSE_COLOR } = require('../tickets/ticketActions');
const { peek, start } = require('../../utils/runtime/cooldown');
const { duration } = require('../../utils/format');

const EPHEMERAL = 1 << 6;
const MAX_CATEGORIES = 5;
const MAX_ROLES_PER_CATEGORY = 6;
const MIN_REASON_LENGTH = 10;
const APPLY_COOLDOWN_MS = 60 * 60 * 1000;

const PANEL_BUTTON_ID = 'setup_rolerequest_1398395532103254157';
const PREFIX = 'rr_';
const PUBLIC_IDS = ['rr_open_', 'rr_select_open', 'rr_rolepick_', 'rr_modal_apply_', 'rr_accept_', 'rr_deny_', 'rr_modal_deny_'];

const isRoleRequestInteraction = (interaction) =>
  (interaction.isMessageComponent() || interaction.isModalSubmit()) &&
  (interaction.customId === PANEL_BUTTON_ID || interaction.customId.startsWith(PREFIX));


const text = (content) => ({ type: 10, content });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const bullet = (line) => `- ${line}  ⁘`;
const label = (name, description, component) => ({ type: 18, label: name, description, component });
const button = (custom_id, name, emoji, extra = {}) => ({
  type: 2,
  style: 2,
  custom_id,
  label: name,
  ...(emojiObject(emoji) ? { emoji: emojiObject(emoji) } : {}),
  ...extra,
});
const row = (...components) => ({ type: 1, components });
const view = (...parts) => ({
  flags: COMPONENTS_V2,
  allowedMentions: { parse: [] },
  components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }],
});
const notice = (lines, title = 'Notice') => ({
  flags: COMPONENTS_V2 | EPHEMERAL,
  allowedMentions: { parse: [] },
  components: [container({ title, lines: Array.isArray(lines) ? lines : [lines] })],
});

function emojiObject(raw) {
  const value = String(raw || '').trim();
  if (!value) return undefined;
  return parseEmoji(value) || { name: value };
}
const validEmoji = (raw) => !raw || Boolean(parseEmoji(raw)) || /^\p{Extended_Pictographic}/u.test(raw);
const shown = (raw) => (raw ? `${raw} ` : '');

function channelDefault(guild, channelId) {
  return channelId && guild.channels.cache.has(channelId) ? [{ type: 'channel', id: channelId }] : undefined;
}

const canReview = (member) =>
  Boolean(member?.permissions?.has(PermissionFlagsBits.Administrator) || member?.permissions?.has(PermissionFlagsBits.ManageRoles));

const isPublic = (id) => PUBLIC_IDS.some((prefix) => id.startsWith(prefix));
const findCategory = (config, id) => config.categories.find((c) => c.id === id);


const CATEGORIES = 'roleRequest.categories';

async function saveSettings(guildId, patch) {
  const set = {};
  for (const [key, value] of Object.entries(patch)) set[`roleRequest.${key}`] = value;
  await updateGuildConfig(guildId, { $set: set });
}

async function createCategory(guildId, { name, desc, emoji }) {
  const category = { id: crypto.randomBytes(4).toString('hex'), name, desc, emoji, roles: [] };
  const result = await updateGuildConfig(guildId, { $push: { [CATEGORIES]: category } }, { [`${CATEGORIES}.${MAX_CATEGORIES - 1}`]: { $exists: false } });
  if (result.modifiedCount !== 1) throw new Error(`Maximum of ${MAX_CATEGORIES} categories reached.`);
}

async function editCategory(guildId, categoryId, { name, desc, emoji }) {
  const result = await updateGuildConfig(
    guildId,
    { $set: { [`${CATEGORIES}.$.name`]: name, [`${CATEGORIES}.$.desc`]: desc, [`${CATEGORIES}.$.emoji`]: emoji } },
    { [`${CATEGORIES}.id`]: categoryId },
  );
  if (result.matchedCount !== 1) throw new Error('That category no longer exists.');
}

const removeCategory = (guildId, categoryId) => updateGuildConfig(guildId, { $pull: { [CATEGORIES]: { id: categoryId } } });

async function addRoles(guildId, categoryId, roleIds, emoji) {
  const category = findCategory(await getRoleRequestConfig(guildId), categoryId);
  if (!category) throw new Error('That category no longer exists.');
  const existing = new Set(category.roles.map((r) => r.roleId));
  const room = MAX_ROLES_PER_CATEGORY - category.roles.length;
  const added = [];
  const skipped = [];
  for (const roleId of roleIds) {
    if (existing.has(roleId) || added.length >= room) skipped.push(roleId);
    else added.push({ roleId, emoji: emoji || null });
  }
  if (added.length) {
    await updateGuildConfig(guildId, { $push: { [`${CATEGORIES}.$.roles`]: { $each: added } } }, { [`${CATEGORIES}.id`]: categoryId });
  }
  return { added, skipped };
}

const removeRoles = (guildId, categoryId, roleIds) =>
  updateGuildConfig(guildId, { $pull: { [`${CATEGORIES}.$.roles`]: { roleId: { $in: roleIds } } } }, { [`${CATEGORIES}.id`]: categoryId });


function homeView(config) {
  return view(
    text(`## ${E.param} Role Request`),
    divider(),
    text(bullet(`${E.dropdown} __Members pick a category, choose a role and apply - your staff accept or deny each request.__`)),
    divider(),
    text([
      bullet(`__Panel Channel :__ ${config.panelChannelId ? `<#${config.panelChannelId}>` : '__Not set__'}`),
      bullet(`__Review Channel :__ ${config.reviewChannelId ? `<#${config.reviewChannelId}>` : '__Not set__'}`),
      bullet(`__Panel Style :__ \`${config.panelStyle === 'menu' ? 'Select Menu' : 'Buttons'}\``),
      bullet(`__Categories :__ ${config.categories.length}/${MAX_CATEGORIES}`),
    ].join('\n')),
    divider(),
    row(
      button('rr_settings', 'Settings', E.settings),
      button('rr_cats', 'Categories', E.categories),
      button('rr_roles', 'Roles', E.role),
      button('rr_send', 'Send Panel', E.send),
    ),
  );
}

function categoriesView(config) {
  const list = config.categories.map((c) => bullet(`${shown(c.emoji)}**${c.name}** : ${c.roles.length}/${MAX_ROLES_PER_CATEGORY} roles`));
  return view(
    text(`## ${E.categories} Role Request Categories`),
    divider(),
    text(`${bullet(`__${config.categories.length}/${MAX_CATEGORIES} categories__`)}${list.length ? `\n${list.join('\n')}` : ''}`),
    divider(),
    row(
      button('rr_cat_add', 'Add Category', E.add, { disabled: config.categories.length >= MAX_CATEGORIES }),
      button('rr_cat_editselect', 'Edit Category', E.channel, { disabled: !config.categories.length }),
      button('rr_cat_removeselect', 'Remove Category', E.remove, { disabled: !config.categories.length }),
    ),
    divider(),
    row(button('rr_home', 'Back', E.back)),
  );
}

function categoryPickerView(config, mode) {
  const editing = mode === 'edit';
  return view(
    text(`## ${editing ? E.channel : E.remove} ${editing ? 'Edit' : 'Remove'} Category`),
    divider(),
    text(bullet(`__Choose which category to ${editing ? 'edit' : 'remove'}.__`)),
    divider(),
    row({
      type: 3,
      custom_id: editing ? 'rr_cat_editselect_pick' : 'rr_cat_removeselect_pick',
      placeholder: 'Choose a category...',
      min_values: 1,
      max_values: 1,
      options: config.categories.map((c) => ({ label: c.name.slice(0, 100), value: c.id, description: `${c.roles.length} role(s)` })),
    }),
    divider(),
    row(button('rr_cats', 'Back', E.back)),
  );
}

function rolesView(config, selected) {
  const parts = [
    text(`## ${E.role} Manage Category Roles`),
    divider(),
    row({
      type: 3,
      custom_id: 'rr_roles_pick',
      placeholder: 'Choose a category to manage...',
      min_values: 1,
      max_values: 1,
      options: config.categories.map((c) => ({
        label: c.name.slice(0, 100),
        value: c.id,
        description: `${c.roles.length} role(s)`,
        default: selected ? selected.id === c.id : false,
      })),
    }),
  ];
  if (selected) {
    const roles = selected.roles.length
      ? selected.roles.map((r, i) => `**${i + 1}.** ${shown(r.emoji)}<@&${r.roleId}>`).join('\n')
      : '__No roles yet - press **Add Roles** to add one.__';
    parts.push(
      divider(),
      text(`${bullet(`__Category :__ ${selected.name}`)}\n${bullet(`__Total Roles :__ ${selected.roles.length}/${MAX_ROLES_PER_CATEGORY}`)}\n${roles}`),
      divider(),
      row(
        button(`rr_addrole_${selected.id}`, 'Add Roles', E.add, { disabled: selected.roles.length >= MAX_ROLES_PER_CATEGORY }),
        button(`rr_removerole_${selected.id}`, 'Remove Roles', E.remove, { disabled: !selected.roles.length }),
      ),
    );
  }
  parts.push(divider(), row(button('rr_home', 'Back', E.back)));
  return view(...parts);
}

function removeRolesView(guild, category) {
  return view(
    text(`## ${E.remove} Remove Roles`),
    divider(),
    text(bullet(`__Choose which role(s) to remove from__ **${category.name}**`)),
    divider(),
    row({
      type: 3,
      custom_id: `rr_removerole_pick_${category.id}`,
      placeholder: 'Choose role(s) to remove...',
      min_values: 1,
      max_values: Math.max(1, category.roles.length),
      options: category.roles.map((r) => ({
        label: (guild.roles.cache.get(r.roleId)?.name || 'Deleted role').slice(0, 100),
        value: r.roleId,
        ...(emojiObject(r.emoji) ? { emoji: emojiObject(r.emoji) } : {}),
      })),
    }),
    divider(),
    row(button(`rr_removerole_back_${category.id}`, 'Back', E.back)),
  );
}


function settingsModal(guild, config) {
  return {
    title: 'Role Request Settings',
    custom_id: 'rr_modal_settings',
    components: [
      label('Panel Channel', 'Where the role request panel is posted', {
        type: 8, custom_id: 'panel_channel', channel_types: [ChannelType.GuildText], min_values: 1, max_values: 1,
        default_values: channelDefault(guild, config.panelChannelId),
      }),
      label('Review Channel', 'Where staff accept or deny requests', {
        type: 8, custom_id: 'review_channel', channel_types: [ChannelType.GuildText], min_values: 1, max_values: 1,
        default_values: channelDefault(guild, config.reviewChannelId),
      }),
      label('Panel Style', 'Buttons or a dropdown menu', {
        type: 3, custom_id: 'panel_style', min_values: 1, max_values: 1,
        options: [
          { label: 'Buttons', value: 'button', description: 'A row of buttons, one per category', default: config.panelStyle !== 'menu' },
          { label: 'Select Menu', value: 'menu', description: 'A dropdown with every category', default: config.panelStyle === 'menu' },
        ],
      }),
      label('Panel Image (optional)', 'Upload to set the panel image, leave empty to keep it', {
        type: 19, custom_id: 'panel_image', min_values: 0, max_values: 1, required: false, file_types: ['image'],
      }),
    ],
  };
}

function categoryModal(category = null) {
  const input = (id, style, placeholder, value, extra = {}) => ({ type: 4, custom_id: id, style, placeholder, ...(value ? { value } : {}), ...extra });
  return {
    title: category ? 'Edit Category' : 'Add Category',
    custom_id: category ? `rr_modal_cat_edit_${category.id}` : 'rr_modal_cat_add',
    components: [
      label('Category Name', undefined, input('name', 1, 'VIP Access', category?.name, { max_length: 100, required: true })),
      label('Description', 'Optional - shown on the panel', input('desc', 1, 'Shown on the panel', category?.desc, { max_length: 150, required: false })),
      label('Emoji', 'Optional - custom emoji work too, e.g. <:name:id>', input('emoji', 1, '🎮 or <:name:id>', category?.emoji, { max_length: 100, required: false })),
    ],
  };
}

function addRolesModal(categoryId, remaining) {
  return {
    title: 'Add Role(s)',
    custom_id: `rr_modal_addrole_${categoryId}`,
    components: [
      label('Role(s)', 'Pick one or more', { type: 6, custom_id: 'role', placeholder: 'Select roles', min_values: 1, max_values: Math.max(1, remaining) }),
      label('Emoji', 'Optional - applied to every role picked above', { type: 4, custom_id: 'emoji', style: 1, placeholder: '🎮 or <:name:id>', required: false, max_length: 100 }),
    ],
  };
}


function buildPanel(guild, config) {
  const { categories, panelStyle, panelImageURL } = config;
  const control = panelStyle === 'menu'
    ? row({
      type: 3,
      custom_id: 'rr_select_open',
      placeholder: 'Select a category...',
      min_values: 1,
      max_values: 1,
      options: categories.map((c) => ({
        label: c.name.slice(0, 100),
        value: `rr_open_${c.id}`,
        ...(c.desc ? { description: c.desc.slice(0, 100) } : {}),
        ...(emojiObject(c.emoji) ? { emoji: emojiObject(c.emoji) } : {}),
      })),
    })
    : row(...categories.map((c) => button(`rr_open_${c.id}`, c.name.slice(0, 80), c.emoji)));

  const parts = [
    text(`## ${E.header} Role Request System`),
    divider(),
    {
      type: 9,
      components: [text(bullet('__Pick a category below to see the roles available in it, choose the one you want, and submit a short request for our team to review.__'))],
      accessory: { type: 11, media: { url: guild.iconURL({ size: 512 }) || 'https://cdn.discordapp.com/embed/avatars/0.png' }, description: 'Server Icon', spoiler: false },
    },
    divider(),
    text(categories.map((c) => `- ${shown(c.emoji)}**${c.name}**${c.desc ? ` : \`${c.desc}\`` : ''}`).join('\n\n')),
    divider(),
  ];
  if (panelImageURL) parts.push({ type: 12, items: [{ media: { url: panelImageURL }, description: 'Role request panel image', spoiler: false }] }, divider());
  parts.push(control, divider(), text(`- ${TICKET_EMOJI.footer} ༯ __Select a category below to get started.__`));
  return view(...parts);
}

async function sendPanel(guild, target = null) {
  const config = await getRoleRequestConfig(guild.id);
  const channel = target || (config.panelChannelId && guild.channels.cache.get(config.panelChannelId));
  if (!channel) return 'The panel channel is not set (or no longer exists) - use **Settings**';
  if (!config.reviewChannelId) return 'The review channel is not set - use **Settings**';
  if (!config.categories.length) return 'Add at least one category first (**Categories** button)';

  const sent = await channel.send(buildPanel(guild, config)).catch((error) => {
    console.error('Role request panel post failed:', error);
    return null;
  });
  if (!sent) return "I couldn't post the panel - check my permissions in that channel";
  await disablePanelMessage(guild, config.panelChannelId, config.panelMessageId);
  await saveSettings(guild.id, { panelChannelId: channel.id, panelMessageId: sent.id });
  return null;
}


function rolePickerView(guild, category) {
  const available = category.roles.filter((r) => guild.roles.cache.has(r.roleId));
  const parts = [text(`## ${shown(category.emoji)}${category.name}`), divider()];
  if (category.desc) parts.push(text(bullet(`__${category.desc}__`)), divider());
  if (!available.length) return view(...parts, text(bullet('__No roles are configured in this category yet.__')));
  return view(
    ...parts,
    row({
      type: 3,
      custom_id: `rr_rolepick_${category.id}`,
      placeholder: 'Choose the role you want...',
      min_values: 1,
      max_values: 1,
      options: available.map((r) => ({
        label: guild.roles.cache.get(r.roleId).name.slice(0, 100),
        value: r.roleId,
        ...(emojiObject(r.emoji) ? { emoji: emojiObject(r.emoji) } : {}),
      })),
    }),
  );
}

function applyModal(category, role) {
  return {
    title: `Apply for ${role.name}`.slice(0, 45),
    custom_id: `rr_modal_apply_${category.id}_${role.id}`,
    components: [
      label(`Why do you want ${role.name}?`.slice(0, 45), undefined, {
        type: 4,
        custom_id: 'input_reason',
        style: 2,
        placeholder: `Tell the staff team why you want this role... (min ${MIN_REASON_LENGTH} characters)`,
        min_length: MIN_REASON_LENGTH,
        max_length: 1000,
        required: true,
      }),
    ],
  };
}

const indent = (value) => value.trim().replace(/\n/g, '\n  ');

function reviewCard(user, category, role, reason) {
  return {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        text(`## ${E.header} New Role Request`),
        divider(),
        text(bullet(`__User :__ ${user} (\`${user.id}\`)`)),
        divider(),
        text(bullet(`__Submitted :__ <t:${Math.floor(Date.now() / 1000)}:R>`)),
        divider(),
        text(bullet(`__Category :__ ${category.name}`)),
        divider(),
        text(bullet(`__Role Requested :__ ${role}`)),
        divider(),
        text(bullet(`__Reason :__ ${indent(reason)}`)),
        divider(),
        row(
          button(`rr_accept_${user.id}_${role.id}`, 'Accept', E.accept, { style: 3 }),
          button(`rr_deny_${user.id}_${role.id}`, 'Deny', E.reject, { style: 4 }),
        ),
      ],
      spoiler: false,
    }],
  };
}

function reviewedCard(message, title, footerLines) {
  const card = message.components[0].toJSON();
  card.components[0] = text(title);
  const footer = footerLines.flatMap((line, i) => (i ? [divider(), text(line)] : [text(line)]));
  card.components = [...card.components.slice(0, -1), ...footer];
  return { flags: COMPONENTS_V2, components: [card], allowedMentions: { parse: [] } };
}

async function sendDecisionDM(client, guild, userId, { accepted, roleName, reviewer, reason }) {
  const emoji = accepted ? E.dmAccepted : E.dmDenied;
  const details = [
    bullet(`__Server :__ ${guild.name}`),
    bullet(`__Role :__ ${roleName}`),
    bullet(`__${accepted ? 'Accepted' : 'Denied'} By :__ ${reviewer}`),
    ...(accepted ? [] : [bullet(`__Reason :__ ${indent(reason)}`)]),
    bullet(`__At :__ <t:${Math.floor(Date.now() / 1000)}:F>`),
  ];
  const payload = {
    flags: COMPONENTS_V2,
    allowedMentions: { parse: [] },
    components: [{
      type: 17,
      accent_color: accepted ? OPEN_COLOR : CLOSE_COLOR,
      components: [
        {
          type: 9,
          components: [text(`## ${emoji} Role Request ${accepted ? 'Accepted' : 'Denied'}
${bullet(`__Hey <@${userId}>, your role request was ${accepted ? '**accepted**, enjoy your new role!' : '**denied**.'}__`)}`)],
          accessory: { type: 11, media: { url: guild.iconURL({ size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png' }, description: 'Server Icon', spoiler: false },
        },
        divider(),
        ...details.flatMap((line, i) => (i ? [divider(), text(line)] : [text(line)])),
      ],
      spoiler: false,
    }],
  };
  try {
    const user = await client.users.fetch(userId);
    await user.send(payload);
  } catch (error) {
    console.warn(`Could not DM the role request result to ${userId}: ${error.message}`);
  }
}

const pendingSubmissions = new Set();
const pendingRequests = new Set();

async function handleApply(interaction, categoryId, roleId) {
  if (pendingSubmissions.has(interaction.user.id)) return interaction.reply(notice('__You already have a request in progress, please wait__'));
  const key = `${interaction.user.id}:${roleId}`;
  if (pendingRequests.has(key)) return interaction.reply(notice('__You already have a pending request for that role - please wait for it to be reviewed__'));
  const cooldownKey = `apply:${interaction.user.id}`;
  const cd = peek(cooldownKey, APPLY_COOLDOWN_MS);
  if (cd.onCooldown) return interaction.reply(notice(`__You can apply again in ${duration(cd.remainingMs)}__`));

  pendingSubmissions.add(interaction.user.id);
  try {
    await interaction.deferReply({ flags: EPHEMERAL });
    const config = await getRoleRequestConfig(interaction.guild.id);
    const category = findCategory(config, categoryId);
    const role = interaction.guild.roles.cache.get(roleId);
    const channel = config.reviewChannelId && interaction.guild.channels.cache.get(config.reviewChannelId);
    const fail = (line) => interaction.editReply({ ...notice(line), flags: COMPONENTS_V2 });

    if (!channel) return fail('__Role Request is not configured - please contact an administrator__');
    if (!category) return fail('__That category no longer exists__');
    if (!role) return fail('__That role no longer exists__');
    if (interaction.member.roles.cache.has(roleId)) return fail('__You already have this role__');

    const reason = interaction.fields.getTextInputValue('input_reason').trim();
    const sent = await channel.send(reviewCard(interaction.user, category, role, reason)).catch((error) => {
      console.error('Role request post failed:', error);
      return null;
    });
    if (!sent) return fail("__I couldn't send your request - please let an admin know__");

    start(cooldownKey);
    pendingRequests.add(key);
    return interaction.editReply({ ...notice(`${E.success} __Request submitted! Our team will review it shortly.__`, 'Role Request'), flags: COMPONENTS_V2 });
  } finally {
    pendingSubmissions.delete(interaction.user.id);
  }
}

async function handleAccept(interaction, userId, roleId) {
  if (!canReview(interaction.member)) return interaction.reply(notice("__You don't have permission to review role requests__"));
  const { guild } = interaction;
  const role = guild.roles.cache.get(roleId);
  if (!role || !role.editable) {
    return interaction.reply(notice("__I can't assign that role - it may no longer exist, or my role needs to be above it in Server Settings__"));
  }
  if (guild.ownerId !== interaction.user.id && role.position >= (interaction.member.roles.highest?.position ?? 0)) {
    return interaction.reply(notice("__You can't give a role that is above your highest role__"));
  }
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return interaction.reply(notice('__That member is no longer in the server__'));

  const added = await member.roles.add(role, `Role request accepted by ${interaction.user.tag}`).then(() => true, (error) => {
    console.error('Role request accept failed:', error);
    return false;
  });
  if (!added) return interaction.reply(notice("__I couldn't give that role - please check my permissions__"));
  pendingRequests.delete(`${userId}:${roleId}`);

  await interaction.update(reviewedCard(interaction.message, `## ${E.accept} Role Request Accepted`, [bullet(`${E.accept} __Accepted By :__ ${interaction.user}`)]));
  await sendDecisionDM(interaction.client, guild, userId, { accepted: true, roleName: role.name, reviewer: interaction.user });
}

async function handleDenyModal(interaction, userId, roleId) {
  if (!canReview(interaction.member)) return interaction.reply(notice("__You don't have permission to review role requests__"));
  const reason = interaction.fields.getTextInputValue('deny_reason').trim();
  const { guild } = interaction;
  pendingRequests.delete(`${userId}:${roleId}`);

  await interaction.update(reviewedCard(interaction.message, `## ${E.reject} Role Request Denied`, [
    bullet(`${E.reject} __Denied By :__ ${interaction.user}`),
    bullet(`__Deny Reason :__ ${indent(reason)}`),
  ]));
  await sendDecisionDM(interaction.client, guild, userId, {
    accepted: false,
    roleName: guild.roles.cache.get(roleId)?.name || 'Deleted role',
    reviewer: interaction.user,
    reason,
  });
}


async function handleSettingsSubmit(interaction) {
  await interaction.deferUpdate();
  const panelChannel = interaction.fields.getSelectedChannels('panel_channel', true).first();
  const reviewChannel = interaction.fields.getSelectedChannels('review_channel', true).first();
  const style = interaction.fields.getStringSelectValues('panel_style')[0];
  const uploaded = interaction.fields.getUploadedFiles('panel_image', false)?.first();

  const patch = { panelChannelId: panelChannel.id, reviewChannelId: reviewChannel.id, panelStyle: style };
  const lines = [];
  if (uploaded) {
    try {
      patch.panelImageURL = await rehostImage(uploaded);
    } catch (error) {
      console.error('Role request panel image rehost failed:', error);
      lines.push("__Panel Image__ : couldn't upload it, kept the previous one");
    }
  }
  await saveSettings(interaction.guild.id, patch);

  const config = await getRoleRequestConfig(interaction.guild.id);
  await interaction.editReply(homeView(config));

  const problem = config.categories.length ? await sendPanel(interaction.guild) : 'Saved - add at least one category (**Categories** button) before the panel can be sent';
  lines.push(problem ? `__${problem}__` : '__Saved__ - the role request panel has been posted');
  await interaction.followUp(notice(lines, 'Role Request Configured'));
}

async function handleButton(interaction) {
  const id = interaction.customId;
  const { guild } = interaction;

  if (id.startsWith('rr_accept_')) return handleAccept(interaction, ...id.split('_').slice(2));
  if (id.startsWith('rr_deny_')) {
    if (!canReview(interaction.member)) return interaction.reply(notice("__You don't have permission to review role requests__"));
    const [userId, roleId] = id.split('_').slice(2);
    return interaction.showModal({
      title: 'Denial Reason',
      custom_id: `rr_modal_deny_${userId}_${roleId}`,
      components: [label('Why is this request being denied?', undefined, {
        type: 4, custom_id: 'deny_reason', style: 2, placeholder: 'Provide a clear, constructive reason...', required: true, max_length: 500,
      })],
    });
  }

  const config = await getRoleRequestConfig(guild.id);
  if (id === PANEL_BUTTON_ID) return interaction.reply({ ...homeView(config), flags: COMPONENTS_V2 | EPHEMERAL });
  if (id === 'rr_home') return interaction.update(homeView(config));
  if (id === 'rr_settings') return interaction.showModal(settingsModal(guild, config));
  if (id === 'rr_cats') return interaction.update(categoriesView(config));
  if (id === 'rr_roles') {
    if (!config.categories.length) return interaction.reply(notice('__Create a category first__'));
    return interaction.update(rolesView(config, null));
  }
  if (id === 'rr_send') {
    await interaction.deferReply({ flags: EPHEMERAL });
    const problem = await sendPanel(guild);
    return interaction.editReply({ ...notice(problem ? `__${problem}__` : `${E.success} __The role request panel was sent__`, 'Role Request'), flags: COMPONENTS_V2 });
  }
  if (id === 'rr_cat_add') return interaction.showModal(categoryModal());
  if (id === 'rr_cat_editselect') return interaction.update(categoryPickerView(config, 'edit'));
  if (id === 'rr_cat_removeselect') return interaction.update(categoryPickerView(config, 'remove'));

  if (id.startsWith('rr_addrole_')) {
    const categoryId = id.slice('rr_addrole_'.length);
    const category = findCategory(config, categoryId);
    if (!category) return interaction.reply(notice('__This category no longer exists__'));
    const remaining = MAX_ROLES_PER_CATEGORY - category.roles.length;
    if (remaining <= 0) return interaction.reply(notice(`__This category already has the maximum of ${MAX_ROLES_PER_CATEGORY} roles__`));
    return interaction.showModal(addRolesModal(categoryId, remaining));
  }
  if (id.startsWith('rr_removerole_back_')) {
    return interaction.update(rolesView(config, findCategory(config, id.slice('rr_removerole_back_'.length))));
  }
  if (id.startsWith('rr_removerole_')) {
    const category = findCategory(config, id.slice('rr_removerole_'.length));
    if (!category) return interaction.reply(notice('__This category no longer exists__'));
    return interaction.update(removeRolesView(guild, category));
  }
  return null;
}

async function handleSelect(interaction) {
  const id = interaction.customId;
  const { guild } = interaction;
  const config = await getRoleRequestConfig(guild.id);

  if (id === 'rr_select_open' || id.startsWith('rr_open_')) {
    const categoryId = (id === 'rr_select_open' ? interaction.values[0] : id).slice('rr_open_'.length);
    const category = findCategory(config, categoryId);
    if (!category) return interaction.reply(notice('__This category no longer exists__'));
    return interaction.reply({ ...rolePickerView(guild, category), flags: COMPONENTS_V2 | EPHEMERAL });
  }
  if (id.startsWith('rr_rolepick_')) {
    const category = findCategory(config, id.slice('rr_rolepick_'.length));
    const role = guild.roles.cache.get(interaction.values[0]);
    if (!category || !role) return interaction.reply(notice('__That category or role no longer exists__'));
    if (interaction.member.roles.cache.has(role.id)) return interaction.reply(notice('__You already have this role__'));
    return interaction.showModal(applyModal(category, role));
  }

  if (id === 'rr_cat_editselect_pick') {
    const category = findCategory(config, interaction.values[0]);
    if (!category) return interaction.update(categoriesView(config));
    return interaction.showModal(categoryModal(category));
  }
  if (id === 'rr_cat_removeselect_pick') {
    await removeCategory(guild.id, interaction.values[0]);
    return interaction.update(categoriesView(await getRoleRequestConfig(guild.id)));
  }
  if (id === 'rr_roles_pick') return interaction.update(rolesView(config, findCategory(config, interaction.values[0])));
  if (id.startsWith('rr_removerole_pick_')) {
    const categoryId = id.slice('rr_removerole_pick_'.length);
    await removeRoles(guild.id, categoryId, interaction.values);
    const next = await getRoleRequestConfig(guild.id);
    return interaction.update(rolesView(next, findCategory(next, categoryId)));
  }
  return null;
}

async function handleModal(interaction) {
  const id = interaction.customId;
  const { guild } = interaction;

  if (id.startsWith('rr_modal_apply_')) return handleApply(interaction, ...id.slice('rr_modal_apply_'.length).split('_'));
  if (id.startsWith('rr_modal_deny_')) {
    if (!canReview(interaction.member)) return interaction.reply(notice("__You don't have permission to review role requests__"));
    return handleDenyModal(interaction, ...id.slice('rr_modal_deny_'.length).split('_'));
  }
  if (id === 'rr_modal_settings') return handleSettingsSubmit(interaction);

  if (id === 'rr_modal_cat_add' || id.startsWith('rr_modal_cat_edit_')) {
    const name = interaction.fields.getTextInputValue('name').trim();
    const desc = interaction.fields.getTextInputValue('desc')?.trim() || null;
    const emoji = interaction.fields.getTextInputValue('emoji')?.trim() || null;
    if (!validEmoji(emoji)) return interaction.reply(notice('__That is not a valid emoji - use a normal emoji or a custom one like <:name:id>__'));
    try {
      if (id === 'rr_modal_cat_add') await createCategory(guild.id, { name, desc, emoji });
      else await editCategory(guild.id, id.slice('rr_modal_cat_edit_'.length), { name, desc, emoji });
    } catch (error) {
      return interaction.reply(notice(`__${error.message}__`));
    }
    return interaction.update(categoriesView(await getRoleRequestConfig(guild.id)));
  }

  if (id.startsWith('rr_modal_addrole_')) {
    const categoryId = id.slice('rr_modal_addrole_'.length);
    const emoji = interaction.fields.getTextInputValue('emoji')?.trim() || null;
    if (!validEmoji(emoji)) return interaction.reply(notice('__That is not a valid emoji - use a normal emoji or a custom one like <:name:id>__'));
    const picked = [...interaction.fields.getSelectedRoles('role', true).values()].filter((r) => r.id !== guild.id && !r.managed);
    if (!picked.length) return interaction.reply(notice('__Pick at least one valid, assignable role__'));

    let result;
    try {
      result = await addRoles(guild.id, categoryId, picked.map((r) => r.id), emoji);
    } catch (error) {
      return interaction.reply(notice(`__${error.message}__`));
    }
    const config = await getRoleRequestConfig(guild.id);
    await interaction.update(rolesView(config, findCategory(config, categoryId)));
    if (result.skipped.length) {
      await interaction.followUp(notice(`__${result.skipped.length} role(s) skipped (already in this category, or it is full)__ : ${result.skipped.map((r) => `<@&${r}>`).join(', ')}`));
    }
  }
  return null;
}

async function handleRoleRequestInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!isPublic(interaction.customId) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply(notice('__You need the Administrator permission to change the role request system__'));
  }
  if (interaction.isModalSubmit()) return handleModal(interaction);
  if (interaction.isStringSelectMenu()) return handleSelect(interaction);
  if (interaction.customId.startsWith('rr_open_')) return handleSelect(interaction);
  return handleButton(interaction);
}

module.exports = { isRoleRequestInteraction, handleRoleRequestInteraction, buildPanel, sendPanel };
