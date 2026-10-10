'use strict';
const { AuditLogEvent: Audit, ChannelType, Events, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { getGuildConfig } = require('../../models/core/moderation');
const { COMPONENTS_V2, textBlock, divider } = require('../../utils/render/embeds');


const ev = (...pairs) => pairs.map(([key, label]) => ({ key, label }));
const CATEGORIES = [
  { key: 'role_events', label: 'Role Events', emoji: { name: 'link', id: '1551750321330589696' }, events: ev(['role_created', 'Role Created'], ['role_deleted', 'Role Deleted'], ['role_updated', 'Role Updated']) },
  { key: 'member_events', label: 'Member Events', emoji: { name: 'members', id: '1551750325835268146' }, events: ev(['member_banned', 'Member Banned'], ['member_joined', 'Member Joined'], ['member_kicked', 'Member Kicked'], ['member_left', 'Member Left'], ['member_timeout', 'Member Timeout'], ['member_unbanned', 'Member Unbanned'], ['members_pruned', 'Members Pruned'], ['nickname_changed', 'Nickname Changed'], ['role_given', 'Role Given'], ['role_removed', 'Role Removed']) },
  { key: 'channel_events', label: 'Channel Events', emoji: { name: 'channels', id: '1551750330595811338' }, events: ev(['channel_created', 'Channel Created'], ['channel_deleted', 'Channel Deleted'], ['channel_updated', 'Channel Updated']) },
  { key: 'message_events', label: 'Message Events', emoji: { name: '2885discordmessagerequestswhite', id: '1551750335066804275' }, events: ev(['message_deleted', 'Message Deleted'], ['messages_bulk_deleted', 'Messages Bulk Deleted'], ['message_edited', 'Message Edited']) },
  { key: 'webhook_events', label: 'Webhook Events', emoji: { name: '7970integrationswebhooks1', id: '1551750339403980860' }, events: ev(['webhook_created', 'Webhook Created'], ['webhook_updated', 'Webhook Updated'], ['webhook_deleted', 'Webhook Deleted']) },
  { key: 'integration_events', label: 'Integration Events', emoji: { name: '8067integrationschannelsfollowed', id: '1551750346714386453' }, events: ev(['integration_created', 'Integration Created'], ['integration_updated', 'Integration Updated'], ['integration_deleted', 'Integration Deleted'], ['bot_added', 'Bot Added']) },
  { key: 'invite_events', label: 'Invite Events', emoji: { name: '9437invite', id: '1551750351017873490' }, events: ev(['invite_created', 'Invite Created'], ['invite_deleted', 'Invite Deleted']) },
  { key: 'voice_events', label: 'Voice Events', emoji: { name: 'voicee', id: '1551750355497386036' }, events: ev(['voice_joined', 'Voice Joined'], ['voice_left', 'Voice Left'], ['voice_moved', 'Voice Moved'], ['voice_server_mute', 'Server Mute'], ['voice_server_deaf', 'Server Deafen']) },
  { key: 'thread_events', label: 'Thread Events', emoji: { name: 'thread', id: '1551750360014524528' }, events: ev(['thread_created', 'Thread Created'], ['thread_deleted', 'Thread Deleted'], ['thread_updated', 'Thread Updated']) },
  { key: 'server_events', label: 'Server Events', emoji: { name: '6849serverguide', id: '1551750364418543636' }, events: ev(['server_updated', 'Server Updated'], ['event_created', 'Event Created'], ['event_updated', 'Event Updated'], ['event_deleted', 'Event Deleted']) },
  { key: 'emoji_sticker_events', label: 'Stickers & Emoji Events', emoji: { name: 'sticker', id: '1551750368906448946' }, events: ev(['emoji_created', 'Emoji Created'], ['emoji_updated', 'Emoji Updated'], ['emoji_deleted', 'Emoji Deleted'], ['sticker_created', 'Sticker Created'], ['sticker_updated', 'Sticker Updated'], ['sticker_deleted', 'Sticker Deleted']) },
  { key: 'automod_events', label: 'AutoMod Events', emoji: { name: '1376logautomodplusd', id: '1551750373369315418' }, events: ev(['automod_rule_created', 'Rule Created'], ['automod_rule_updated', 'Rule Updated'], ['automod_rule_deleted', 'Rule Deleted'], ['automod_blocked', 'Message Blocked']) },
  { key: 'soundboard_events', label: 'Soundboard Events', emoji: { name: 'voicee', id: '1551750355497386036' }, events: ev(['sound_created', 'Sound Created'], ['sound_updated', 'Sound Updated'], ['sound_deleted', 'Sound Deleted']) },
];
const categoryOf = (key) => CATEGORIES.find((c) => c.key === key) || null;


const channelCache = new Map();
async function channelsOf(guildId) {
  const hit = channelCache.get(guildId);
  if (hit && Date.now() - hit.at < 30_000) return hit.channels;
  const config = await getGuildConfig(guildId);
  const off = config.logDisabled || {};
  const channels = Object.fromEntries(Object.entries(config.logChannels || {}).filter(([event]) => !off[event]));
  channelCache.set(guildId, { at: Date.now(), channels });
  return channels;
}
const forgetGuild = (guildId) => channelCache.delete(guildId);

async function logChannel(guild, event) {
  const id = (await channelsOf(guild.id))[event];
  const channel = id && guild.channels.cache.get(id);
  return channel && channel.isTextBased() ? channel : null;
}


const recentCommands = new Map();
function trackCommand(guildId, userId, command) {
  const list = (recentCommands.get(guildId) || []).filter((c) => Date.now() - c.at < 20_000);
  list.push({ userId, command, at: Date.now() });
  recentCommands.set(guildId, list);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const claimed = new Set();

async function audit(guild, types, match = () => true, { claim = false } = {}) {
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return null;
  await sleep(900);
  const logs = await guild.fetchAuditLogs(types.length === 1 ? { type: types[0], limit: 10 } : { limit: 15 }).catch(() => null);
  if (!logs) return null;
  const now = Date.now();
  const entry = logs.entries.find((e) => types.includes(e.action) && now - e.createdTimestamp < 20_000 && !(claim && claimed.has(e.id)) && match(e));
  if (entry && claim) {
    claimed.add(entry.id);
    setTimeout(() => claimed.delete(entry.id), 60_000).unref();
  }
  return entry || null;
}

const mention = (id) => `<@${id}> \`${id}\``;
function actorText(guild, entry) {
  if (!entry?.executorId) return 'Unknown';
  if (entry.executorId === guild.client.user.id) {
    const command = (recentCommands.get(guild.id) || []).filter((c) => Date.now() - c.at < 20_000).pop();
    if (command) return `${mention(command.userId)} \`via ${command.command}\``;
    return `${mention(entry.executorId)} \`bot\``;
  }
  return mention(entry.executorId);
}

const PALETTE = {
  role_events:          { create: 0x3fd67e, delete: 0xff5d73, update: 0xffb347, warn: 0xffd23f, info: 0x6c8cff },
  member_events:        { create: 0x2fe0a2, delete: 0xe5384f, update: 0xffa63d, warn: 0xffc933, info: 0x5b9dff },
  channel_events:       { create: 0x4ad8c7, delete: 0xff6b6b, update: 0xffc14d, warn: 0xffd23f, info: 0x4dabf7 },
  message_events:       { create: 0x7ddc5a, delete: 0xff4d6d, update: 0xf7b731, warn: 0xffd23f, info: 0x74a9ff },
  webhook_events:       { create: 0x5bd6a0, delete: 0xf0506e, update: 0xffaa5a, warn: 0xffd23f, info: 0x66b3ff },
  integration_events:   { create: 0x3ecfb2, delete: 0xe8455f, update: 0xffb86b, warn: 0xffd23f, info: 0x5ec2ff },
  invite_events:        { create: 0x8fe36b, delete: 0xff6f7d, update: 0xffc766, warn: 0xffd23f, info: 0x7c9bff },
  voice_events:         { create: 0x33d4b8, delete: 0xff5c8a, update: 0xff9f43, warn: 0xffc933, info: 0x8b7bff },
  thread_events:        { create: 0x6fdc8c, delete: 0xff7285, update: 0xffbe55, warn: 0xffd23f, info: 0x7d8bff },
  server_events:        { create: 0x9ae65c, delete: 0xdc3c55, update: 0xf5a623, warn: 0xffd23f, info: 0x5c7cfa },
  emoji_sticker_events: { create: 0x5fdc9c, delete: 0xff5a64, update: 0xffb03b, warn: 0xffd23f, info: 0x6ea8ff },
  automod_events:       { create: 0x4fd18b, delete: 0xc92a45, update: 0xff9a3c, warn: 0xffab00, info: 0x6b8afd },
  soundboard_events:    { create: 0x44e0a8, delete: 0xf2557a, update: 0xffa94d, warn: 0xffd23f, info: 0x9a8cff },
};
const EVENT_COLOR = {
  member_banned: 0xb3122f, member_kicked: 0xff7043, member_left: 0xff8a9b, member_timeout: 0xffc107, members_pruned: 0xa8102e,
  messages_bulk_deleted: 0xa8102e, automod_blocked: 0xffab00, role_given: 0x5ee6a8, role_removed: 0xff9aa8, voice_moved: 0x7c8cff,
};
const DEFAULT_COLOR = { create: 0x57f287, delete: 0xed4245, update: 0xfaa61a, warn: 0xfee75c, info: 0x5865f2 };
function colorOf(event, kind) {
  if (EVENT_COLOR[event]) return EVENT_COLOR[event];
  const category = CATEGORIES.find((c) => c.events.some((e) => e.key === event));
  return (category && PALETTE[category.key]?.[kind]) || DEFAULT_COLOR[kind] || DEFAULT_COLOR.info;
}


const clip = (value, max = 900) => {
  const text = String(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const time = (ms) => `<t:${Math.floor(ms / 1000)}:F>`;
const human = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2');
const yesNo = (value) => (value ? 'Yes' : 'No');

function render({ title, kind = 'info', fields = [], actor, actorLabel = 'Executor', reason }, event) {
  const body = fields.filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([label, value]) => `- __${label}__ : ${clip(value)}`).join('\n');
  const who = [actor ? `- __${actorLabel}__ : ${actor}` : null, reason ? `- __Reason__ : ${clip(reason, 500)}` : null].filter(Boolean).join('\n');
  const parts = [textBlock(`## ${title}`), divider()];
  if (body) parts.push(textBlock(body), divider());
  if (who) parts.push(textBlock(who), divider());
  parts.push(textBlock(`-# ${time(Date.now())}`));
  return {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: colorOf(event, kind), components: parts, spoiler: false }],
    allowedMentions: { parse: [] },
  };
}

async function emit(guild, events, build) {
  try {
    const keys = [].concat(events);
    const configured = await channelsOf(guild.id);
    if (!keys.some((key) => configured[key])) return;
    const spec = await build();
    const channel = spec && await logChannel(guild, spec.event || keys[0]);
    if (channel) await channel.send(render(spec, spec.event || keys[0])).catch(() => {});
  } catch (error) {
    console.error(`Logs (${[].concat(events)}) failed:`, error);
  }
}

function changes(pairs) {
  return pairs.filter(([, before, after]) => before !== after).map(([label, before, after]) => [label, `${before ?? 'None'} → ${after ?? 'None'}`]);
}
const permissionNames = (bits) => bits.toArray().map(human).join(', ');
function permissionChanges(before, after) {
  const oldPerms = new PermissionsBitField(before);
  const newPerms = new PermissionsBitField(after);
  return [['Permissions added', permissionNames(oldPerms.missing(newPerms))], ['Permissions removed', permissionNames(newPerms.missing(oldPerms))]]
    .filter(([, list]) => list);
}


function registerLogs(client) {
  const on = (event, handler) => client.on(event, (...args) => Promise.resolve(handler(...args)).catch((error) => console.error(`Logs handler ${event} failed:`, error)));
  const done = (guild, entry, extra = {}) => ({ actor: actorText(guild, entry), reason: entry?.reason, ...extra });

  on(Events.GuildRoleCreate, (role) => emit(role.guild, 'role_created', async () => {
    const entry = await audit(role.guild, [Audit.RoleCreate], (e) => e.targetId === role.id);
    return done(role.guild, entry, {
      title: 'Role Created', kind: 'create',
      fields: [['Role', `<@&${role.id}> \`${role.id}\``], ['Name', role.name], ['Color', role.hexColor], ['Hoisted', yesNo(role.hoist)], ['Mentionable', yesNo(role.mentionable)]],
    });
  }));
  on(Events.GuildRoleDelete, (role) => emit(role.guild, 'role_deleted', async () => {
    const entry = await audit(role.guild, [Audit.RoleDelete], (e) => e.targetId === role.id);
    return done(role.guild, entry, {
      title: 'Role Deleted', kind: 'delete',
      fields: [['Role', `${role.name} \`${role.id}\``], ['Color', role.hexColor], ['Members', role.members?.size]],
    });
  }));
  on(Events.GuildRoleUpdate, (before, after) => emit(after.guild, 'role_updated', async () => {
    const fields = [
      ...changes([['Name', before.name, after.name], ['Color', before.hexColor, after.hexColor], ['Hoisted', yesNo(before.hoist), yesNo(after.hoist)], ['Mentionable', yesNo(before.mentionable), yesNo(after.mentionable)]]),
      ...(before.permissions.bitfield !== after.permissions.bitfield ? permissionChanges(before.permissions, after.permissions) : []),
    ];
    if (!fields.length) return null;
    const entry = await audit(after.guild, [Audit.RoleUpdate], (e) => e.targetId === after.id);
    return done(after.guild, entry, { title: 'Role Updated', kind: 'update', fields: [['Role', `<@&${after.id}> \`${after.id}\``], ...fields] });
  }));

  on(Events.GuildMemberAdd, (member) => {
    emit(member.guild, 'member_joined', async () => ({
      title: 'Member Joined', kind: 'create', actorLabel: 'Member', actor: mention(member.id),
      fields: [['Account created', time(member.user.createdTimestamp)], ['Bot', yesNo(member.user.bot)], ['Members now', member.guild.memberCount]],
    }));
    if (member.user.bot) {
      emit(member.guild, 'bot_added', async () => {
        const entry = await audit(member.guild, [Audit.BotAdd], (e) => e.targetId === member.id);
        return done(member.guild, entry, { title: 'Bot Added', kind: 'create', fields: [['Bot', `${member.user.tag} \`${member.id}\``]] });
      });
    }
  });
  const prunes = new Set();
  on(Events.GuildMemberRemove, (member) => emit(member.guild, ['member_left', 'member_kicked', 'members_pruned'], async () => {
    const entry = await audit(member.guild, [Audit.MemberKick, Audit.MemberBanAdd, Audit.MemberPrune], (e) => e.action === Audit.MemberPrune || e.targetId === member.id);
    if (entry?.action === Audit.MemberBanAdd) return null;
    if (entry?.action === Audit.MemberPrune) {
      if (prunes.has(entry.id)) return null;
      prunes.add(entry.id);
      setTimeout(() => prunes.delete(entry.id), 60_000).unref();
      return done(member.guild, entry, { event: 'members_pruned', title: 'Members Pruned', kind: 'delete', fields: [['Members removed', entry.extra?.removed], ['Inactive for (days)', entry.extra?.days]] });
    }
    const fields = [['Member', `${member.user.tag} \`${member.id}\``], ['Joined', member.joinedTimestamp ? time(member.joinedTimestamp) : null], ['Members now', member.guild.memberCount]];
    if (entry) return done(member.guild, entry, { event: 'member_kicked', title: 'Member Kicked', kind: 'delete', fields });
    return { event: 'member_left', title: 'Member Left', kind: 'delete', fields, actorLabel: 'Member', actor: mention(member.id) };
  }));
  on(Events.GuildBanAdd, (ban) => emit(ban.guild, 'member_banned', async () => {
    const entry = await audit(ban.guild, [Audit.MemberBanAdd], (e) => e.targetId === ban.user.id);
    return done(ban.guild, entry, {
      title: 'Member Banned', kind: 'delete', reason: entry?.reason || ban.reason,
      fields: [['Member', `${ban.user.tag} \`${ban.user.id}\``]],
    });
  }));
  on(Events.GuildBanRemove, (ban) => emit(ban.guild, 'member_unbanned', async () => {
    const entry = await audit(ban.guild, [Audit.MemberBanRemove], (e) => e.targetId === ban.user.id);
    return done(ban.guild, entry, { title: 'Member Unbanned', kind: 'create', fields: [['Member', `${ban.user.tag} \`${ban.user.id}\``]] });
  }));
  on(Events.GuildMemberUpdate, (before, after) => {
    const guild = after.guild;
    if (!before.partial) {
      const added = after.roles.cache.filter((r) => !before.roles.cache.has(r.id));
      const removed = before.roles.cache.filter((r) => !after.roles.cache.has(r.id));
      for (const [list, event, title, kind] of [[added, 'role_given', 'Role Given', 'create'], [removed, 'role_removed', 'Role Removed', 'delete']]) {
        if (!list.size) continue;
        emit(guild, event, async () => {
          const entry = await audit(guild, [Audit.MemberRoleUpdate], (e) => e.targetId === after.id);
          return done(guild, entry, { title, kind, fields: [['Member', mention(after.id)], ['Roles', list.map((r) => `<@&${r.id}>`).join(' ')]] });
        });
      }
      if (before.nickname !== after.nickname) {
        emit(guild, 'nickname_changed', async () => {
          const entry = await audit(guild, [Audit.MemberUpdate], (e) => e.targetId === after.id);
          return done(guild, entry, { title: 'Nickname Changed', kind: 'update', fields: [['Member', mention(after.id)], ...changes([['Nickname', before.nickname, after.nickname]])] });
        });
      }
    }
    if (before.communicationDisabledUntilTimestamp !== after.communicationDisabledUntilTimestamp) {
      const until = after.communicationDisabledUntilTimestamp;
      emit(guild, 'member_timeout', async () => {
        const entry = await audit(guild, [Audit.MemberUpdate], (e) => e.targetId === after.id);
        return done(guild, entry, {
          title: until && until > Date.now() ? 'Member Timeout' : 'Timeout Removed', kind: until && until > Date.now() ? 'warn' : 'create',
          fields: [['Member', mention(after.id)], ['Until', until && until > Date.now() ? time(until) : null]],
        });
      });
    }
  });

  const channelKind = (channel) => human(ChannelType[channel.type] || 'Channel');
  on(Events.ChannelCreate, (channel) => channel.guild && emit(channel.guild, 'channel_created', async () => {
    const entry = await audit(channel.guild, [Audit.ChannelCreate], (e) => e.targetId === channel.id);
    return done(channel.guild, entry, { title: 'Channel Created', kind: 'create', fields: [['Channel', `<#${channel.id}> \`${channel.id}\``], ['Type', channelKind(channel)], ['Category', channel.parent?.name]] });
  }));
  on(Events.ChannelDelete, (channel) => channel.guild && emit(channel.guild, 'channel_deleted', async () => {
    const entry = await audit(channel.guild, [Audit.ChannelDelete], (e) => e.targetId === channel.id);
    return done(channel.guild, entry, { title: 'Channel Deleted', kind: 'delete', fields: [['Channel', `#${channel.name} \`${channel.id}\``], ['Type', channelKind(channel)], ['Category', channel.parent?.name]] });
  }));
  on(Events.ChannelUpdate, (before, after) => after.guild && emit(after.guild, 'channel_updated', async () => {
    const overwrites = (channel) => JSON.stringify([...(channel.permissionOverwrites?.cache.values() || [])].map((o) => [o.id, String(o.allow.bitfield), String(o.deny.bitfield)]).sort());
    const fields = [
      ...changes([
        ['Name', before.name, after.name], ['Topic', before.topic, after.topic], ['NSFW', before.nsfw === undefined ? undefined : yesNo(before.nsfw), after.nsfw === undefined ? undefined : yesNo(after.nsfw)],
        ['Category', before.parent?.name, after.parent?.name], ['Slowmode', before.rateLimitPerUser, after.rateLimitPerUser], ['Bitrate', before.bitrate, after.bitrate], ['User limit', before.userLimit, after.userLimit],
      ]).filter(([, v]) => !v.startsWith('undefined')),
      ...(overwrites(before) !== overwrites(after) ? [['Permissions', 'Permission overwrites changed']] : []),
    ];
    if (!fields.length) return null;
    const entry = await audit(after.guild, [Audit.ChannelUpdate, Audit.ChannelOverwriteCreate, Audit.ChannelOverwriteUpdate, Audit.ChannelOverwriteDelete], (e) => e.targetId === after.id);
    return done(after.guild, entry, { title: 'Channel Updated', kind: 'update', fields: [['Channel', `<#${after.id}> \`${after.id}\``], ...fields] });
  }));

  on(Events.MessageDelete, (message) => message.guild && message.author?.id !== client.user.id && emit(message.guild, 'message_deleted', async () => {
    const author = message.author;
    const entry = author ? await audit(message.guild, [Audit.MessageDelete], (e) => e.targetId === author.id && e.extra?.channel?.id === message.channelId) : null;
    const attachments = message.attachments?.size;
    return {
      title: 'Message Deleted', kind: 'delete',
      fields: [['Author', author ? mention(author.id) : '`Not cached`'], ['Channel', `<#${message.channelId}>`], ['Content', message.content ? message.content : null], ['Attachments', attachments || null], ['Message ID', message.id]],
      actorLabel: 'Deleted by', actor: entry ? actorText(message.guild, entry) : author ? `${mention(author.id)} \`or unknown\`` : 'Unknown',
    };
  }));
  on(Events.MessageBulkDelete, (messages, channel) => emit(channel.guild, 'messages_bulk_deleted', async () => {
    const entry = await audit(channel.guild, [Audit.MessageBulkDelete], (e) => e.targetId === channel.id);
    return done(channel.guild, entry, { title: 'Messages Bulk Deleted', kind: 'delete', fields: [['Channel', `<#${channel.id}>`], ['Messages', messages.size]] });
  }));
  on(Events.MessageUpdate, (before, after) => after.guild && !after.author?.bot && emit(after.guild, 'message_edited', async () => {
    if (before.content === after.content || after.content === null) return null;
    return {
      title: 'Message Edited', kind: 'update', actorLabel: 'Author', actor: after.author ? mention(after.author.id) : 'Unknown',
      fields: [['Channel', `<#${after.channelId}>`], ['Before', before.content || '`Not cached`'], ['After', after.content], ['Jump', after.url]],
    };
  }));

  on(Events.WebhooksUpdate, (channel) => emit(channel.guild, ['webhook_created', 'webhook_updated', 'webhook_deleted'], async () => {
    const entry = await audit(channel.guild, [Audit.WebhookCreate, Audit.WebhookUpdate, Audit.WebhookDelete], (e) => {
      const target = e.changes?.find((c) => c.key === 'channel_id');
      return !target || (target.new || target.old) === channel.id;
    }, { claim: true });
    if (!entry) return null;
    const name = entry.changes?.find((c) => c.key === 'name');
    const created = entry.action === Audit.WebhookCreate;
    const deleted = entry.action === Audit.WebhookDelete;
    return done(channel.guild, entry, {
      event: created ? 'webhook_created' : deleted ? 'webhook_deleted' : 'webhook_updated',
      title: created ? 'Webhook Created' : deleted ? 'Webhook Deleted' : 'Webhook Updated', kind: created ? 'create' : deleted ? 'delete' : 'update',
      fields: [['Webhook', `${name?.new || name?.old || 'Unknown'} \`${entry.targetId}\``], ['Channel', `<#${channel.id}>`]],
    });
  }));
  on(Events.GuildIntegrationsUpdate, (guild) => emit(guild, ['integration_created', 'integration_updated', 'integration_deleted'], async () => {
    const entry = await audit(guild, [Audit.IntegrationCreate, Audit.IntegrationUpdate, Audit.IntegrationDelete], () => true, { claim: true });
    if (!entry) return null;
    const name = entry.changes?.find((c) => c.key === 'name');
    const type = entry.changes?.find((c) => c.key === 'type');
    const created = entry.action === Audit.IntegrationCreate;
    const deleted = entry.action === Audit.IntegrationDelete;
    return done(guild, entry, {
      event: created ? 'integration_created' : deleted ? 'integration_deleted' : 'integration_updated',
      title: created ? 'Integration Created' : deleted ? 'Integration Deleted' : 'Integration Updated', kind: created ? 'create' : deleted ? 'delete' : 'update',
      fields: [['Integration', `${name?.new || name?.old || 'Unknown'} \`${entry.targetId}\``], ['Type', type?.new || type?.old]],
    });
  }));

  on(Events.InviteCreate, (invite) => invite.guild && emit(invite.guild, 'invite_created', async () => ({
    title: 'Invite Created', kind: 'create', actor: invite.inviter ? mention(invite.inviter.id) : 'Unknown', actorLabel: 'Created by',
    fields: [['Code', invite.code], ['Channel', invite.channel ? `<#${invite.channel.id}>` : null], ['Max uses', invite.maxUses || 'Unlimited'], ['Expires', invite.expiresTimestamp ? time(invite.expiresTimestamp) : 'Never'], ['Temporary', yesNo(invite.temporary)]],
  })));
  on(Events.InviteDelete, (invite) => invite.guild && emit(invite.guild, 'invite_deleted', async () => {
    const entry = await audit(invite.guild, [Audit.InviteDelete], (e) => e.changes?.some((c) => c.key === 'code' && c.old === invite.code));
    return done(invite.guild, entry, { title: 'Invite Deleted', kind: 'delete', fields: [['Code', invite.code], ['Channel', invite.channel ? `<#${invite.channel.id}>` : null]] });
  }));

  on(Events.VoiceStateUpdate, (before, after) => {
    const guild = after.guild;
    const member = after.member || before.member;
    if (!member || member.id === client.user.id) return;
    const self = { actorLabel: 'Member', actor: mention(member.id) };
    if (!before.channelId && after.channelId) {
      emit(guild, 'voice_joined', async () => ({ title: 'Voice Joined', kind: 'create', ...self, fields: [['Channel', `<#${after.channelId}>`]] }));
    } else if (before.channelId && !after.channelId) {
      emit(guild, 'voice_left', async () => ({ title: 'Voice Left', kind: 'delete', ...self, fields: [['Channel', `<#${before.channelId}>`]] }));
    } else if (before.channelId !== after.channelId) {
      emit(guild, 'voice_moved', async () => {
        const entry = await audit(guild, [Audit.MemberMove], () => true);
        return {
          title: 'Voice Moved', kind: 'info', ...self,
          fields: [['From', `<#${before.channelId}>`], ['To', `<#${after.channelId}>`], ...(entry ? [['Moved by', actorText(guild, entry)]] : [])],
        };
      });
    }
    for (const [prop, label] of [['serverMute', 'Server Muted'], ['serverDeaf', 'Server Deafened']]) {
      if (before[prop] !== after[prop] && after.channelId) {
        emit(guild, prop === 'serverMute' ? 'voice_server_mute' : 'voice_server_deaf', async () => {
          const entry = await audit(guild, [Audit.MemberUpdate], (e) => e.targetId === member.id);
          return done(guild, entry, { title: after[prop] ? label : label.replace('Server ', 'Server Un'), kind: after[prop] ? 'warn' : 'create', fields: [['Member', mention(member.id)], ['Channel', `<#${after.channelId}>`]] });
        });
      }
    }
  });

  on(Events.ThreadCreate, (thread, newlyCreated) => newlyCreated && emit(thread.guild, 'thread_created', async () => ({
    title: 'Thread Created', kind: 'create', actorLabel: 'Created by', actor: thread.ownerId ? mention(thread.ownerId) : 'Unknown',
    fields: [['Thread', `<#${thread.id}> \`${thread.id}\``], ['Parent', thread.parentId ? `<#${thread.parentId}>` : null]],
  })));
  on(Events.ThreadDelete, (thread) => emit(thread.guild, 'thread_deleted', async () => {
    const entry = await audit(thread.guild, [Audit.ThreadDelete], (e) => e.targetId === thread.id);
    return done(thread.guild, entry, { title: 'Thread Deleted', kind: 'delete', fields: [['Thread', `${thread.name} \`${thread.id}\``], ['Parent', thread.parentId ? `<#${thread.parentId}>` : null]] });
  }));
  on(Events.ThreadUpdate, (before, after) => emit(after.guild, 'thread_updated', async () => {
    const fields = changes([
      ['Name', before.name, after.name], ['Archived', yesNo(before.archived), yesNo(after.archived)], ['Locked', yesNo(before.locked), yesNo(after.locked)],
      ['Auto archive minutes', before.autoArchiveDuration, after.autoArchiveDuration], ['Slowmode', before.rateLimitPerUser, after.rateLimitPerUser],
    ]);
    if (!fields.length) return null;
    const entry = await audit(after.guild, [Audit.ThreadUpdate], (e) => e.targetId === after.id);
    return done(after.guild, entry, { title: 'Thread Updated', kind: 'update', fields: [['Thread', `<#${after.id}> \`${after.id}\``], ...fields] });
  }));

  on(Events.GuildUpdate, (before, after) => emit(after, 'server_updated', async () => {
    const fields = [
      ...changes([
        ['Name', before.name, after.name], ['Description', before.description, after.description], ['Owner', before.ownerId, after.ownerId],
        ['Verification level', before.verificationLevel, after.verificationLevel], ['AFK channel', before.afkChannelId, after.afkChannelId],
        ['System channel', before.systemChannelId, after.systemChannelId], ['Language', before.preferredLocale, after.preferredLocale],
      ]),
      ...(before.icon !== after.icon ? [['Icon', 'Changed']] : []), ...(before.banner !== after.banner ? [['Banner', 'Changed']] : []),
    ];
    if (!fields.length) return null;
    const entry = await audit(after, [Audit.GuildUpdate], () => true);
    return done(after, entry, { title: 'Server Updated', kind: 'update', fields });
  }));
  const eventFields = (event) => [['Event', `${event.name} \`${event.id}\``], ['Starts', event.scheduledStartTimestamp ? time(event.scheduledStartTimestamp) : null], ['Where', event.channelId ? `<#${event.channelId}>` : event.entityMetadata?.location]];
  on(Events.GuildScheduledEventCreate, (event) => emit(event.guild, 'event_created', async () => ({
    title: 'Event Created', kind: 'create', actorLabel: 'Created by', actor: event.creatorId ? mention(event.creatorId) : 'Unknown', fields: eventFields(event),
  })));
  on(Events.GuildScheduledEventUpdate, (before, after) => emit(after.guild, 'event_updated', async () => {
    const fields = changes([['Name', before?.name, after.name], ['Description', before?.description, after.description], ['Status', before?.status, after.status]]);
    if (!fields.length) return null;
    const entry = await audit(after.guild, [Audit.GuildScheduledEventUpdate], (e) => e.targetId === after.id);
    return done(after.guild, entry, { title: 'Event Updated', kind: 'update', fields: [...eventFields(after).slice(0, 1), ...fields] });
  }));
  on(Events.GuildScheduledEventDelete, (event) => emit(event.guild, 'event_deleted', async () => {
    const entry = await audit(event.guild, [Audit.GuildScheduledEventDelete], (e) => e.targetId === event.id);
    return done(event.guild, entry, { title: 'Event Deleted', kind: 'delete', fields: eventFields(event) });
  }));

  const expression = (create, remove, update, kinds, label, describe, watched) => {
    on(create, (item) => emit(item.guild, `${label.toLowerCase()}_created`, async () => {
      const entry = await audit(item.guild, [kinds.create], (e) => e.targetId === item.id);
      return done(item.guild, entry, { title: `${label} Created`, kind: 'create', fields: describe(item) });
    }));
    on(remove, (item) => emit(item.guild, `${label.toLowerCase()}_deleted`, async () => {
      const entry = await audit(item.guild, [kinds.remove], (e) => e.targetId === item.id);
      return done(item.guild, entry, { title: `${label} Deleted`, kind: 'delete', fields: describe(item) });
    }));
    on(update, (before, after) => emit(after.guild, `${label.toLowerCase()}_updated`, async () => {
      const fields = changes(watched.map(([name, prop]) => [name, before[prop], after[prop]]));
      if (!fields.length) return null;
      const entry = await audit(after.guild, [kinds.update], (e) => e.targetId === after.id);
      return done(after.guild, entry, { title: `${label} Updated`, kind: 'update', fields: [describe(after)[0], ...fields] });
    }));
  };
  expression(Events.GuildEmojiCreate, Events.GuildEmojiDelete, Events.GuildEmojiUpdate,
    { create: Audit.EmojiCreate, remove: Audit.EmojiDelete, update: Audit.EmojiUpdate }, 'Emoji',
    (e) => [['Emoji', `${e.animated ? '<a:' : '<:'}${e.name}:${e.id}> \`${e.id}\``], ['Name', e.name]], [['Name', 'name']]);
  expression(Events.GuildStickerCreate, Events.GuildStickerDelete, Events.GuildStickerUpdate,
    { create: Audit.StickerCreate, remove: Audit.StickerDelete, update: Audit.StickerUpdate }, 'Sticker',
    (s) => [['Sticker', `${s.name} \`${s.id}\``], ['Description', s.description]], [['Name', 'name'], ['Description', 'description'], ['Tags', 'tags']]);

  const ruleFields = (rule) => [['Rule', `${rule.name} \`${rule.id}\``], ['Enabled', yesNo(rule.enabled)]];
  on(Events.AutoModerationRuleCreate, (rule) => emit(rule.guild, 'automod_rule_created', async () => ({
    title: 'AutoMod Rule Created', kind: 'create', actorLabel: 'Created by', actor: rule.creatorId ? mention(rule.creatorId) : 'Unknown', fields: ruleFields(rule),
  })));
  on(Events.AutoModerationRuleUpdate, (before, after) => emit(after.guild, 'automod_rule_updated', async () => {
    const fields = changes([['Name', before?.name, after.name], ['Enabled', before && yesNo(before.enabled), yesNo(after.enabled)]]);
    if (!fields.length) return null;
    const entry = await audit(after.guild, [Audit.AutoModerationRuleUpdate], (e) => e.targetId === after.id);
    return done(after.guild, entry, { title: 'AutoMod Rule Updated', kind: 'update', fields: [ruleFields(after)[0], ...fields] });
  }));
  on(Events.AutoModerationRuleDelete, (rule) => emit(rule.guild, 'automod_rule_deleted', async () => {
    const entry = await audit(rule.guild, [Audit.AutoModerationRuleDelete], (e) => e.targetId === rule.id);
    return done(rule.guild, entry, { title: 'AutoMod Rule Deleted', kind: 'delete', fields: ruleFields(rule) });
  }));
  on(Events.AutoModerationActionExecution, (execution) => emit(execution.guild, 'automod_blocked', async () => ({
    title: 'AutoMod Action', kind: 'warn', actorLabel: 'Member', actor: mention(execution.userId),
    fields: [['Rule', execution.ruleTriggerType !== undefined ? `${execution.autoModerationRule?.name || execution.ruleId}` : execution.ruleId], ['Channel', execution.channelId ? `<#${execution.channelId}>` : null], ['Matched', execution.matchedKeyword || execution.matchedContent], ['Content', execution.content]],
  })));

  if (Events.GuildSoundboardSoundCreate) {
    const sound = (s) => [['Sound', `${s.name} \`${s.soundId || s.id}\``], ['Volume', s.volume]];
    const soundId = (s) => s.soundId || s.id;
    on(Events.GuildSoundboardSoundCreate, (s) => s.guild && emit(s.guild, 'sound_created', async () => {
      const entry = await audit(s.guild, [Audit.SoundboardSoundCreate], (e) => e.targetId === soundId(s));
      return done(s.guild, entry, { title: 'Sound Created', kind: 'create', fields: sound(s) });
    }));
    on(Events.GuildSoundboardSoundUpdate, (before, after) => after.guild && emit(after.guild, 'sound_updated', async () => {
      const fields = changes([['Name', before?.name, after.name], ['Volume', before?.volume, after.volume]]);
      if (!fields.length) return null;
      const entry = await audit(after.guild, [Audit.SoundboardSoundUpdate], (e) => e.targetId === soundId(after));
      return done(after.guild, entry, { title: 'Sound Updated', kind: 'update', fields: [sound(after)[0], ...fields] });
    }));
    on(Events.GuildSoundboardSoundDelete, (s) => s.guild && emit(s.guild, 'sound_deleted', async () => {
      const entry = await audit(s.guild, [Audit.SoundboardSoundDelete], (e) => e.targetId === soundId(s));
      return done(s.guild, entry, { title: 'Sound Deleted', kind: 'delete', fields: sound(s) });
    }));
  }
}

module.exports = { CATEGORIES, categoryOf, registerLogs, trackCommand, forgetGuild, channelsOf, audit, emit, mention, render };
