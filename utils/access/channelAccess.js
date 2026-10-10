'use strict';
const { PermissionFlagsBits: P, ChannelType, OverwriteType } = require('discord.js');
const { card, notice } = require('../render/embeds');
const { EMOJI } = require('../emojis');

const SUPPORTED = new Set([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
  ChannelType.GuildForum,
  ChannelType.GuildMedia,
  ChannelType.GuildCategory,
]);
const isVoice = (channel) => channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice;

const KINDS = {
  lock: { flags: (channel) => (isVoice(channel) ? ['Connect'] : ['SendMessages', 'SendMessagesInThreads']), state: 'locked' },
  hide: { flags: () => ['ViewChannel'], state: 'hidden' },
};
const ACTIONS = {
  lock: { kind: KINDS.lock, undo: false, done: 'is now locked' },
  unlock: { kind: KINDS.lock, undo: true, done: 'is now unlocked' },
  hide: { kind: KINDS.hide, undo: false, done: 'is now hidden' },
  unhide: { kind: KINDS.hide, undo: true, done: 'is no longer hidden' },
};

function resolveChannel(message, query) {
  if (!query) return message.channel;
  const id = (query.match(/^<#(\d+)>$/) || [])[1] || (/^\d{15,25}$/.test(query) ? query : null);
  if (id) return message.guild.channels.cache.get(id) || null;
  const clean = query.replace(/^#/, '').toLowerCase();
  return message.guild.channels.cache.find((channel) => channel.name.toLowerCase() === clean) || null;
}

async function keepBotAccess(channel, me, reason) {
  if (me.permissions.has(P.Administrator)) return;
  const mine = channel.permissionsFor(me);
  const keep = ['ViewChannel', 'SendMessages'].filter((flag) => mine.has(P[flag]));
  if (keep.length) {
    const allow = Object.fromEntries(keep.map((flag) => [flag, true]));
    await channel.permissionOverwrites.edit(me.id, allow, { reason, type: OverwriteType.Member });
  }
}

async function changeAccess(message, args, action) {
  const { kind, undo, done } = ACTIONS[action];
  const { guild } = message;

  const channel = resolveChannel(message, args.join(' ').trim());
  if (!channel) return notice(message, "__Couldn't find that channel__");
  if (!SUPPORTED.has(channel.type)) return notice(message, "__That channel can't be changed__");
  if (!channel.permissionsFor(message.member).has(P.ManageChannels)) return notice(message, "__You don't have permission__");
  const me = guild.members.me;
  if (!channel.permissionsFor(me).has(P.ManageRoles)) {
    return notice(message, '__I need the Manage Roles permission in that channel__');
  }

  const flags = kind.flags(channel);
  const active = Boolean(channel.permissionOverwrites.cache.get(guild.id)?.deny.has(P[flags[0]]));
  const name = `**#${channel.name}**`;
  if (active === !undo) return notice(message, `__${name} ${undo ? "isn't" : 'is already'} ${kind.state}__`);

  const reason = `${action} by ${message.author.username}`;
  try {
    if (!undo) await keepBotAccess(channel, me, reason);
    const change = Object.fromEntries(flags.map((flag) => [flag, undo ? null : false]));
    await channel.permissionOverwrites.edit(guild.id, change, { reason, type: OverwriteType.Role });
  } catch (error) {
    console.error(`&${action} failed in ${guild.name}:`, error);
    return notice(message, "__Couldn't change that channel's permissions__");
  }
  return card(message, { title: `${EMOJI.success} Success`, lines: [`__${name} ${done}__`] });
}

module.exports = { changeAccess };
