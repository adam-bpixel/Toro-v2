'use strict';
const path = require('node:path');
const { prefixesFor } = require('../../models/settings/prefix');
const { COMMAND_PREFIX, swapName } = require('../localize');
const { disablePanelMessage } = require('./panels');
const { isOwner } = require('../../models/economy/premium');
const { withSupportServer } = require('../supportServer');
const { notYours, invokerOf } = require('../access/gate');

const ROOT = path.join(__dirname, '..');
const COMPONENTS_V2 = 1 << 15;
const EPHEMERAL = 1 << 6;

const onScreen = new Map();
const idle = new Map();

function keepAlive(message, ms) {
  clearTimeout(idle.get(message.id)?.timer);
  const timer = setTimeout(() => {
    idle.delete(message.id);
    onScreen.delete(message.id);
    disablePanelMessage(message.guild, message.channelId, message.id).catch(() => {});
  }, ms);
  timer.unref();
  idle.set(message.id, { timer, ms });
}

function touchIdle(interaction) {
  const tracked = interaction.isMessageComponent() && idle.get(interaction.message.id);
  if (tracked) keepAlive(interaction.message, tracked.ms);
}

const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const COMMAND_MENTION = /<\/([\w-]+)((?: [\w-]+){0,2}):\d+>/g;
const SUBCOMMAND = 1;
const SUBCOMMAND_GROUP = 2;

function hasSubcommand(command, sub) {
  if (!command) return false;
  let options = command.options;
  for (const part of sub.split(' ').filter(Boolean)) {
    const next = (options || []).find((o) => o.name === part && (o.type === SUBCOMMAND || o.type === SUBCOMMAND_GROUP));
    if (!next) return false;
    options = next.options;
  }
  return true;
}

async function contextOf(source) {
  const user = source.author || source.user;
  const { server, personal } = await prefixesFor(source.guild?.id, user.id);
  const commands = new Map();
  for (const command of source.client.application?.commands.cache.values() ?? []) {
    commands.set(command.name, command);
  }
  const botMember = source.guild ? source.guild.members.me : null;
  const botAvatar = (botMember || source.client.user).displayAvatarURL({ size: 512 });
  return {
    mention: `<@${user.id}>`,
    username: user.username,
    displayName: (source.member && source.member.displayName) || user.displayName || user.username,
    userId: user.id,
    avatar: user.displayAvatarURL({ extension: 'png', size: 1024 }),
    botAvatar,
    botName: (botMember && botMember.displayName) || source.client.user.displayName || source.client.user.username,
    guild: source.guild ? source.guild.name : 'this server',
    prefix: personal || server,
    invokedAs: source.invokedAs || null,
    appId: source.client.application?.id || source.client.user.id,
    commands,
  };
}

function fill(value, ctx) {
  if (typeof value === 'string') {
    return withSupportServer(value)
      .replace(/\{\{(mention|username|displayName|userId|avatar|botAvatar|guild|botName)\}\}/g, (_, key) => ctx[key])
      .replace(COMMAND_PREFIX, () => ctx.prefix)
      .replace(/^[\s\S]*$/, (text) => swapName(text, ctx.prefix, ctx.invokedAs))
      .replace(COMMAND_MENTION, (_, name, sub) => {
        const command = ctx.commands.get(name);
        return `</${name}${sub}:${hasSubcommand(command, sub) ? command.id : ctx.appId}>`;
      });
  }
  if (Array.isArray(value)) return value.map((item) => fill(item, ctx));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = key === 'custom_id' ? item : fill(item, ctx);
    return out;
  }
  return value;
}

const DROP = Symbol('drop');
function ownSku(value) {
  if (Array.isArray(value)) return value.map(ownSku).filter((item) => item !== DROP);
  if (!value || typeof value !== 'object') return value;
  if (has(value, 'sku_id')) return process.env.PREMIUM_SKU_ID ? { ...value, sku_id: process.env.PREMIUM_SKU_ID } : DROP;
  const out = {};
  for (const [key, item] of Object.entries(value)) out[key] = ownSku(item);
  const emptied = value.type === 1 && Array.isArray(value.components) && value.components.length && !out.components.length;
  return emptied ? DROP : out;
}

function disableInteractive(value) {
  if (Array.isArray(value)) return value.map(disableInteractive);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = disableInteractive(item);
    if (out.custom_id) out.disabled = true;
    return out;
  }
  return value;
}

function disableUnrecorded(value, flow) {
  const recorded = new Set(flow.transitions.map((t) => t.custom_id));
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out = {};
      for (const [key, item] of Object.entries(node)) out[key] = walk(item);
      if (out.custom_id && !recorded.has(out.custom_id)) out.disabled = true;
      return out;
    }
    return node;
  };
  return walk(value);
}

const OWNER_OPTION = 'Owner Commands';
function hideOwnerOnly(value, userId) {
  if (isOwner(userId)) return value;
  if (Array.isArray(value)) return value.filter((item) => !(item && item.value === OWNER_OPTION)).map((item) => hideOwnerOnly(item, userId));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, hideOwnerOnly(item, userId)]));
  return value;
}

function buildPayload(snap, ctx, { flow = null, edit = false, interactive = false } = {}) {
  const payload = {};
  const content = fill(snap.content || '', ctx);
  const embeds = fill(snap.embeds || [], ctx);
  let components = hideOwnerOnly(ownSku(fill(snap.components || [], ctx)), ctx.userId);
  if (!interactive) components = flow ? disableUnrecorded(components, flow) : disableInteractive(components);

  if (snap.v2) {
    payload.flags = COMPONENTS_V2;
    payload.components = components;
  } else {
    if (content || edit) payload.content = content;
    if (embeds.length || edit) payload.embeds = embeds;
    if (components.length || edit) payload.components = components;
  }

  payload.allowedMentions = { parse: ['users'] };

  if (snap.ephemeral) payload.flags = (payload.flags || 0) | EPHEMERAL;

  const files = (snap.attachments || []).map((a) => ({
    attachment: a.local ? path.join(ROOT, a.local) : a.url,
    name: a.filename,
  }));
  if (files.length) payload.files = files;
  else if (edit) payload.attachments = [];
  return payload;
}

const isEmpty = (payload) => !payload.content && !(payload.embeds || []).length
  && !(payload.components || []).length && !(payload.files || []).length;

function flowsOf(command) {
  const recorded = command.recorded || {};
  return [recorded.flow, ...(recorded.variants || []).map((v) => v.flow)].filter(Boolean);
}

async function sendReplies(message, replies, flow, ctx, idleMs = 0) {
  for (const snap of replies || []) {
    const live = snap.primary && flow ? flow : null;
    const payload = buildPayload(snap, ctx, { flow: live });
    if (isEmpty(payload)) continue;
    const sent = snap.reply
      ? await message.reply({ ...payload, allowedMentions: { ...payload.allowedMentions, repliedUser: Boolean(snap.ping) } })
      : await message.channel.send(payload);
    if (live) onScreen.set(sent.id, { flow: live, state: live.start, userId: ctx.userId });
    if (live && idleMs) keepAlive(sent, idleMs);
  }
}

async function replay(message, command, args = []) {
  const recorded = command.recorded;
  const ctx = await contextOf(message);

  const asked = String(args[0] || '').toLowerCase();
  if (recorded.details && asked && has(recorded.details, asked)) {
    return sendReplies(message, recorded.details[asked].replies, null, ctx);
  }

  let source = recorded;
  if (args.length && recorded.variants && recorded.variants.length) {
    const usable = recorded.variants.filter((v) => v.args <= args.length).sort((a, b) => b.args - a.args);
    if (usable.length) source = usable[0];
  }
  for (const emoji of source.reactions || []) {
    await message.react(emoji).catch(() => {});
  }
  await sendReplies(message, source.replies, source.flow, ctx, command.idleDisableMs);
}

function buildModal(modal, ctx) {
  const filled = fill(modal, ctx);
  const strip = (obj) => Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
  return {
    title: filled.title || 'Form',
    custom_id: filled.custom_id,
    components: (filled.components || []).map((row, rowIndex) => ({
      type: row.type,
      components: (row.components || []).map((f, fieldIndex) => {
        const field = strip({
          type: f.type, custom_id: f.custom_id, style: f.style, label: f.label,
          placeholder: f.placeholder, min_length: f.min_length, max_length: f.max_length,
          required: f.required,
        });
        if (!field.custom_id) field.custom_id = `field_${rowIndex}_${fieldIndex}`;
        if (!field.label) field.label = `Field ${rowIndex + 1}`;
        return field;
      }),
    })),
  };
}

function findTransition(flow, stateId, interaction) {
  const value = interaction.isStringSelectMenu() ? interaction.values[0] : null;
  const matches = flow.transitions.filter(
    (t) => t.custom_id === interaction.customId && (t.value === undefined || t.value === null ? null : t.value) === value,
  );
  return matches.find((t) => t.from === stateId) || matches.find((t) => t.global) || matches[0] || null;
}

async function handleComponent(interaction, commands) {
  const known = onScreen.get(interaction.message.id);
  const owner = (known && known.userId) || (await invokerOf(interaction));
  if (owner && owner !== interaction.user.id) return notYours(interaction);
  const all = [...commands.values()].flatMap(flowsOf);
  const order = known ? [known.flow, ...all] : all;

  let flow = null;
  let transition = null;
  for (const candidate of order) {
    const stateId = known && known.flow === candidate ? known.state : null;
    transition = findTransition(candidate, stateId, interaction);
    if (transition) { flow = candidate; break; }
  }
  if (!transition) return interaction.deferUpdate();
  if (transition.value === OWNER_OPTION && !isOwner(interaction.user.id)) return interaction.deferUpdate();

  const ctx = await contextOf(interaction);
  if (transition.kind === 'update') {
    await interaction.update(buildPayload(flow.states[transition.to], ctx, { flow, edit: true }));
    onScreen.set(interaction.message.id, { flow, state: transition.to, userId: owner || interaction.user.id });
  } else if (transition.kind === 'reply') {
    let first = true;
    for (const snap of transition.reply || []) {
      const payload = buildPayload(snap, ctx);
      if (isEmpty(payload)) continue;
      if (first) await interaction.reply(payload);
      else await interaction.followUp(payload);
      first = false;
    }
    if (first) await interaction.deferUpdate();
  } else if (transition.kind === 'modal' && transition.modal) {
    await interaction.showModal(buildModal(transition.modal, ctx));
  } else {
    await interaction.deferUpdate();
  }
}

module.exports = { replay, handleComponent, touchIdle, buildPayload, buildModal, fill, contextOf };
