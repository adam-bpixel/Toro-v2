'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { checkTarget, checkRoleTarget } = require('../utils/access/permissions');
const { limitReached, recordAction } = require('../models/enforcement/modTools');
const { card, notice } = require('../utils/render/embeds');
const { hit } = require('../utils/runtime/cooldown');
const { EMOJI } = require('../utils/emojis');

// The moderation actions behind both the prefix commands (commands/moderation) and the slash
// natives (handlers/slashRuntime). Callers check the invoker's permission and parse their own
// input; everything after that lives here, so &ban and /ban can never behave differently.

const COOLDOWN_MS = 10000;
const MAX_TIMEOUT_MS = 28 * 86400000;
const MAX_NICKNAME = 32;
const STATES = { allow: true, deny: false, reset: null };
const SHOWN = { true: 'Allowed', false: 'Denied', null: 'Reset' };

const fail = (message, text) => notice(message, `__${text}__`);

function cooldownLeft(message, action) {
  const cd = hit(`${action}:${message.author.id}`, COOLDOWN_MS);
  return cd.onCooldown ? `Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s` : null;
}

// Resolves a user to a member of this guild the invoker is allowed to act on.
async function targetMember(message, user, { allowSelf = false } = {}) {
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member) return { reason: "That user isn't in this server" };
  if (allowSelf && member.id === message.author.id) return { member };
  const check = checkTarget(message, member);
  return check.ok ? { member } : { reason: check.reason };
}

async function ban(message, user, { reason, deleteDays = 0 }) {
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (member) {
    const check = checkTarget(message, member);
    if (!check.ok) return fail(message, check.reason);
  } else if (user.id === message.author.id || user.id === message.client.user.id) {
    return fail(message, "You can't target that user");
  }
  const limit = await limitReached(message.guild.id, 'ban');
  if (limit) return notice(message, limit);
  const wait = cooldownLeft(message, 'ban');
  if (wait) return fail(message, wait);

  const banned = await message.guild.members.ban(user.id, { reason, deleteMessageSeconds: deleteDays * 86400 }).catch(() => null);
  if (!banned) return fail(message, "Couldn't ban that user (check my role position/permissions)");
  await recordAction(message.guild.id, 'ban');
  return card(message, { title: 'Command', lines: [`__Banned__ **${user.username}**`, `__Reason__ : ${reason}`] });
}

async function kick(message, user, reason) {
  const { member, reason: denied } = await targetMember(message, user);
  if (denied) return fail(message, denied);
  const limit = await limitReached(message.guild.id, 'kick');
  if (limit) return notice(message, limit);
  const wait = cooldownLeft(message, 'kick');
  if (wait) return fail(message, wait);

  const kicked = await member.kick(reason).then(() => true).catch(() => false);
  if (!kicked) return fail(message, "Couldn't kick that user (check my role position/permissions)");
  await recordAction(message.guild.id, 'kick');
  return card(message, { title: 'Command', lines: [`__Kicked__ **${user.username}**`, `__Reason__ : ${reason}`] });
}

// `query` is a user ID, a mention, or the username of a banned user.
async function unban(message, query, reason) {
  const text = String(query).replace(/^<@!?(\d+)>$/, '$1');
  let entry;
  if (/^\d{15,25}$/.test(text)) {
    // 10026 = Unknown Ban: the user simply isn't banned. Anything else means we couldn't look.
    entry = await message.guild.bans.fetch(text).catch((error) => (error.code === 10026 ? null : undefined));
  } else {
    const bans = await message.guild.bans.fetch().catch(() => undefined);
    const name = text.replace(/^@/, '').toLowerCase();
    entry = bans && (bans.find((b) => b.user.username.toLowerCase() === name) || null);
  }
  if (entry === undefined) return fail(message, "Couldn't read the ban list (check my permissions)");
  if (!entry) return fail(message, 'That user is not banned');

  const why = reason || 'No reason provided';
  const done = await message.guild.members.unban(entry.user.id, `${why} (by ${message.author.username})`).then(() => true).catch(() => false);
  if (!done) return fail(message, "Couldn't unban that user");
  return card(message, { title: 'Command', lines: [`__Unbanned__ **${entry.user.username}**`, `__Reason__ : ${why}`] });
}

async function timeout(message, user, ms, reason) {
  const { member, reason: denied } = await targetMember(message, user);
  if (denied) return fail(message, denied);
  if (!ms || ms > MAX_TIMEOUT_MS) return fail(message, 'Give a duration like `10m`, `2h` or `1d` (28 days at most)');
  const limit = await limitReached(message.guild.id, 'timeout');
  if (limit) return notice(message, limit);

  const done = await member.timeout(ms, reason).then(() => true).catch(() => false);
  if (!done) return fail(message, "Couldn't timeout that member (check my role position/permissions)");
  await recordAction(message.guild.id, 'timeout');
  return card(message, {
    title: 'Command',
    lines: [`__Timed out__ **${user.username}** __until__ <t:${Math.floor((Date.now() + ms) / 1000)}:R>`, `__Reason__ : ${reason}`],
  });
}

async function untimeout(message, user) {
  const { member, reason: denied } = await targetMember(message, user);
  if (denied) return fail(message, denied);
  if (!member.isCommunicationDisabled()) return fail(message, 'That member is not timed out');
  const done = await member.timeout(null).then(() => true).catch(() => false);
  if (!done) return fail(message, "Couldn't remove that timeout");
  return card(message, { title: 'Command', lines: [`__Removed the timeout of__ **${user.username}**`] });
}

// An empty nickname resets it.
async function nickname(message, user, nick) {
  const { member, reason: denied } = await targetMember(message, user, { allowSelf: true });
  if (denied) return fail(message, denied);
  const value = nick || null;
  if (value && value.length > MAX_NICKNAME) return fail(message, `The nickname can be ${MAX_NICKNAME} characters at most`);
  const done = await member.setNickname(value, `Changed by ${message.author.username}`).then(() => true).catch(() => false);
  if (!done) return fail(message, "Couldn't change that nickname (check my role position/permissions)");
  return card(message, {
    title: 'Command',
    lines: [value ? `__Changed the nickname of__ **${user.username}** __to__ **${value}**` : `__Reset the nickname of__ **${user.username}**`],
  });
}

// Sets one permission overwrite for a member or role in the current channel.
// `flag` is a PermissionFlagsBits key, `state` one of allow | deny | reset.
async function editPermission(message, { id, flag, state }) {
  const role = message.guild.roles.cache.get(id);
  const member = role ? null : await message.guild.members.fetch(id).catch(() => null);
  if (!role && !member) return fail(message, "Couldn't find that member or role");
  const check = role ? checkRoleTarget(message, role) : member.id === message.author.id ? { ok: true } : checkTarget(message, member);
  if (!check.ok) return fail(message, check.reason);
  if (!(flag in PermissionFlagsBits)) return fail(message, "That isn't a permission (try `send_messages`, `view_channel`, `connect`...)");
  if (!(state in STATES)) return fail(message, 'State must be `allow`, `deny` or `reset`');

  const channel = message.channel;
  if (!channel.permissionOverwrites) return fail(message, "Permissions can't be changed in this channel");
  const value = STATES[state];
  if (value === true && message.guild.ownerId !== message.author.id && !channel.permissionsFor(message.member).has(PermissionFlagsBits[flag])) {
    return fail(message, "You can't allow a permission you don't have in that channel");
  }
  const done = await channel.permissionOverwrites.edit(id, { [flag]: value }, { reason: `mperm by ${message.author.username}` }).then(() => true).catch(() => false);
  if (!done) return fail(message, "Couldn't change that permission (check my permissions in that channel)");
  return card(message, {
    title: `${EMOJI.success} Permission`,
    lines: [`__${SHOWN[String(value)]}__ \`${flag}\` __for__ ${role || member} __in__ ${channel}`],
  });
}

module.exports = { ban, kick, unban, timeout, untimeout, nickname, editPermission, targetMember, MAX_TIMEOUT_MS };
