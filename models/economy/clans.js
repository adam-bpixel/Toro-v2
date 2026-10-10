'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../core/db');
const { getGuildConfig, invalidateGuildConfig } = require('../core/moderation');
const { notice, card, container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { resolveRole } = require('../../utils/access/resolve');
const { checkRoleTarget } = require('../../utils/access/permissions');
const { peek, start: startCooldown } = require('../../utils/runtime/cooldown');
const { isPremium } = require('./premium');

const clans = () => getDb().collection('clans');
const guildConfigs = () => getDb().collection('guildConfig');

const DEFAULT_MEMBER_LIMIT = 50;
const PREMIUM_MEMBER_LIMIT = 100;
const DEFAULT_COLEADER_LIMIT = 3;
const MAX_LIMIT = 1000;
const MAX_MANAGER_ROLES = 5;
const NAME_MIN = 3;
const NAME_MAX = 32;
const ROLE_FIELDS = { leader: 'clanLeaderRoleId', coleader: 'clanCoLeaderRoleId' };

const unwrap = (result) => (result && result.value) || result;
const managerRoleIds = (config) => config.clanManagerRoleIds || [];
const leadershipRoleIds = (config) => [config.clanLeaderRoleId, config.clanCoLeaderRoleId].filter(Boolean);


const parseClanId = (text) => (/^\d{1,9}$/.test(String(text || '')) ? Number(text) : null);
const parseCount = (text) => (/^\d{1,4}$/.test(String(text || '')) ? Number(text) : null);

async function getClan(guildId, clanId) {
  return clanId === null ? null : clans().findOne({ guildId, clanId });
}
const getClanOf = (guildId, userId) => clans().findOne({ guildId, memberIds: userId });
const listClans = (guildId) => clans().find({ guildId }).sort({ clanId: 1 }).toArray();

const rankOf = (clan, userId) => {
  if (clan.leaderId === userId) return 'leader';
  return clan.coleaderIds.includes(userId) ? 'coleader' : 'member';
};

const canManageClans = (member, config) =>
  member.permissions.has(PermissionFlagsBits.Administrator) ||
  member.roles.cache.some((role) => managerRoleIds(config).includes(role.id));


const setupRoleId = (config, kind) => config[ROLE_FIELDS[kind]] || null;

async function setSetupRole(guildId, kind, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { [ROLE_FIELDS[kind]]: roleId } });
  invalidateGuildConfig(guildId);
}

async function addManagerRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $addToSet: { clanManagerRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function removeManagerRole(guildId, roleId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $pull: { clanManagerRoleIds: roleId } });
  invalidateGuildConfig(guildId);
}

async function nextClanId(guildId) {
  await getGuildConfig(guildId);
  const result = await guildConfigs().findOneAndUpdate(
    { guildId },
    { $inc: { clanCounter: 1 } },
    { returnDocument: 'after' },
  );
  invalidateGuildConfig(guildId);
  return unwrap(result).clanCounter;
}


function roleProblem(guild, role) {
  if (role.id === guild.id) return "@everyone can't be assigned";
  if (role.managed) return 'managed by an integration or bot';
  if (role.position >= guild.members.me.roles.highest.position) return 'above my highest role';
  return null;
}

const assignable = (guild, roleId) => {
  const role = roleId ? guild.roles.cache.get(roleId) : null;
  return role && !roleProblem(guild, role) ? role : null;
};

async function editRoles(guild, userId, { add = [], remove = [] }, reason) {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  const toAdd = add.map((id) => assignable(guild, id)).filter(Boolean);
  const toRemove = remove.map((id) => assignable(guild, id)).filter((role) => role && member.roles.cache.has(role.id));
  if (toRemove.length) await member.roles.remove(toRemove, reason).catch(() => {});
  if (toAdd.length) await member.roles.add(toAdd, reason).catch(() => {});
}

async function applyRank(guild, config, clan, userId, rank) {
  const want = [
    clan.roleId,
    rank === 'leader' && config.clanLeaderRoleId,
    rank === 'coleader' && config.clanCoLeaderRoleId,
  ].filter(Boolean);
  const drop = leadershipRoleIds(config).filter((id) => !want.includes(id));
  await editRoles(guild, userId, { add: want, remove: drop }, 'Clan rank updated');
}

const stripRoles = (guild, config, clan, userId, reason) =>
  editRoles(guild, userId, { remove: [clan.roleId, ...leadershipRoleIds(config)].filter(Boolean) }, reason);

async function resyncRanks(guild, dropRoleId = null) {
  const config = await getGuildConfig(guild.id);
  for (const clan of await listClans(guild.id)) {
    for (const userId of [clan.leaderId, ...clan.coleaderIds]) {
      if (dropRoleId) await editRoles(guild, userId, { remove: [dropRoleId] }, 'Clan setup changed');
      await applyRank(guild, config, clan, userId, rankOf(clan, userId));
    }
  }
}


async function validateName(guildId, name, exceptClanId = null) {
  if (name.length < NAME_MIN || name.length > NAME_MAX) return `Name must be ${NAME_MIN}-${NAME_MAX} characters`;
  const taken = await clans().findOne({ guildId, nameKey: name.toLowerCase() });
  return taken && taken.clanId !== exceptClanId ? 'A clan with that name already exists' : null;
}

async function createClan(guild, { name, leaderId, roleId }) {
  const clan = {
    guildId: guild.id,
    clanId: await nextClanId(guild.id),
    name,
    nameKey: name.toLowerCase(),
    leaderId,
    coleaderIds: [],
    memberIds: [leaderId],
    roleId,
    roleCreated: true,
    memberLimit: (await isPremium('server', guild.id)) ? PREMIUM_MEMBER_LIMIT : DEFAULT_MEMBER_LIMIT,
    coleaderLimit: DEFAULT_COLEADER_LIMIT,
    hoursMs: {},
    warnings: 0,
    createdAt: new Date(),
  };
  await clans().insertOne(clan);
  const config = await getGuildConfig(guild.id);
  await applyRank(guild, config, clan, leaderId, 'leader');
  await provisionChannels(guild, clan, config);
  logClan(guild, `__Clan__ **${clan.name}** __was created - leader__ <@${leaderId}>`);
  return clan;
}

async function deleteClan(guild, clan) {
  const config = await getGuildConfig(guild.id);
  await clans().deleteOne({ guildId: guild.id, clanId: clan.clanId });
  const ownRole = clan.roleCreated ? guild.roles.cache.get(clan.roleId) : null;
  for (const userId of clan.memberIds) {
    await editRoles(
      guild,
      userId,
      { remove: [...(clan.roleCreated ? [] : [clan.roleId]), ...leadershipRoleIds(config)] },
      'Clan deleted',
    );
  }
  if (ownRole) await ownRole.delete('Clan deleted').catch(() => {});
  if (clan.tag) for (const userId of clan.memberIds) await clearClanTag(guild, userId);
  logClan(guild, `__Clan__ **${clan.name}** __was deleted__`);
  for (const spec of Object.values(CHANNEL_KINDS)) {
    if (clan[spec.createdField]) await guild.channels.cache.get(clan[spec.idField])?.delete('Clan deleted').catch(() => {});
  }
}


async function addMember(guild, clan, userId) {
  if (clan.memberIds.includes(userId)) return 'That user is already in this clan';
  if (await getClanOf(guild.id, userId)) return 'That user is already in another clan';
  const full = `The clan is full (${clan.memberLimit}/${clan.memberLimit})`;
  if (clan.memberIds.length >= clan.memberLimit) return full;

  const result = await clans().updateOne(
    {
      guildId: guild.id,
      clanId: clan.clanId,
      memberIds: { $ne: userId },
      $expr: { $lt: [{ $size: '$memberIds' }, '$memberLimit'] },
    },
    { $addToSet: { memberIds: userId } },
  );
  if (!result.modifiedCount) return full;
  await applyRank(guild, await getGuildConfig(guild.id), clan, userId, 'member');
  if (clan.tag) await applyClanTag(guild, clan, userId);
  logClan(guild, `<@${userId}> __joined__ **${clan.name}**`);
  return null;
}

async function removeMember(guild, clan, userId) {
  if (!clan.memberIds.includes(userId)) return "That user isn't in this clan";
  if (clan.leaderId === userId) return "The leader can't be removed - use `&switchleader` first";
  await clans().updateOne(
    { guildId: guild.id, clanId: clan.clanId },
    { $pull: { memberIds: userId, coleaderIds: userId }, $unset: { [`hoursMs.${userId}`]: '' } },
  );
  await stripRoles(guild, await getGuildConfig(guild.id), clan, userId, 'Removed from clan');
  if (clan.tag) await clearClanTag(guild, userId);
  logClan(guild, `<@${userId}> __left__ **${clan.name}**`);
  return null;
}

async function promoteCoLeader(guild, clan, userId) {
  if (!clan.memberIds.includes(userId)) return "That user isn't in this clan";
  if (clan.leaderId === userId) return 'That user is the leader';
  if (clan.coleaderIds.includes(userId)) return 'That user is already a co-leader';
  const full = `The clan already has ${clan.coleaderLimit}/${clan.coleaderLimit} co-leaders`;
  if (clan.coleaderIds.length >= clan.coleaderLimit) return full;

  const result = await clans().updateOne(
    {
      guildId: guild.id,
      clanId: clan.clanId,
      coleaderIds: { $ne: userId },
      $expr: { $lt: [{ $size: '$coleaderIds' }, '$coleaderLimit'] },
    },
    { $addToSet: { coleaderIds: userId } },
  );
  if (!result.modifiedCount) return full;
  await applyRank(guild, await getGuildConfig(guild.id), clan, userId, 'coleader');
  logClan(guild, `<@${userId}> __is now a co-leader of__ **${clan.name}**`);
  return null;
}

async function demoteCoLeader(guild, clan, userId) {
  if (!clan.coleaderIds.includes(userId)) return "That user isn't a co-leader";
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $pull: { coleaderIds: userId } });
  await applyRank(guild, await getGuildConfig(guild.id), clan, userId, 'member');
  logClan(guild, `<@${userId}> __is no longer a co-leader of__ **${clan.name}**`);
  return null;
}

async function transferLeader(guild, clan, userId) {
  if (!clan.memberIds.includes(userId)) return "That user isn't in this clan";
  if (clan.leaderId === userId) return 'That user is already the leader';

  const coleaderIds = clan.coleaderIds.filter((id) => id !== userId);
  const oldLeaderStays = coleaderIds.length < clan.coleaderLimit;
  if (oldLeaderStays) coleaderIds.push(clan.leaderId);
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { leaderId: userId, coleaderIds } });

  const config = await getGuildConfig(guild.id);
  await applyRank(guild, config, clan, userId, 'leader');
  await applyRank(guild, config, clan, clan.leaderId, oldLeaderStays ? 'coleader' : 'member');
  logClan(guild, `<@${userId}> __is now the leader of__ **${clan.name}**`);
  return null;
}


async function renameClan(guild, clan, name) {
  const problem = await validateName(guild.id, name, clan.clanId);
  if (problem) return problem;
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { name, nameKey: name.toLowerCase() } });
  if (clan.roleCreated) await guild.roles.cache.get(clan.roleId)?.setName(name, 'Clan renamed').catch(() => {});
  for (const spec of Object.values(CHANNEL_KINDS)) {
    if (clan[spec.createdField]) await guild.channels.cache.get(clan[spec.idField])?.setName(name, 'Clan renamed').catch(() => {});
  }
  return null;
}

async function setMemberLimit(guild, clan, limit) {
  if (limit < 1 || limit > MAX_LIMIT) return `Limit must be between 1 and ${MAX_LIMIT}`;
  if (limit < clan.memberIds.length) return `The clan already has ${clan.memberIds.length} members`;
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { memberLimit: limit } });
  return null;
}

async function setCoLeaderLimit(guild, clan, limit) {
  if (limit > MAX_LIMIT) return `Limit can't be more than ${MAX_LIMIT}`;
  if (limit < clan.coleaderIds.length) return `The clan already has ${clan.coleaderIds.length} co-leaders`;
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { coleaderLimit: limit } });
  return null;
}

async function setMemberHours(guild, clan, userId, hours) {
  if (!clan.memberIds.includes(userId)) return "That user isn't in this clan";
  await clans().updateOne(
    { guildId: guild.id, clanId: clan.clanId },
    { $set: { [`hoursMs.${userId}`]: Math.round(hours * 3600000) } },
  );
  return null;
}

async function setClanRole(guild, clan, role) {
  if (role.id === clan.roleId) return 'That is already the clan role';
  const problem = roleProblem(guild, role);
  if (problem) return problem;
  const config = await getGuildConfig(guild.id);
  if (leadershipRoleIds(config).includes(role.id)) return 'used as the leader / co-leader role';
  if (await clans().findOne({ guildId: guild.id, roleId: role.id })) return 'already the role of another clan';

  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { roleId: role.id, roleCreated: false } });
  for (const userId of clan.memberIds) {
    await editRoles(guild, userId, { add: [role.id], remove: [clan.roleId] }, 'Clan role changed');
  }
  if (clan.roleCreated) await guild.roles.cache.get(clan.roleId)?.delete('Clan role replaced').catch(() => {});
  return null;
}

async function clearWarnings(guild, clan) {
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { warnings: 0 } });
  return clan.warnings || 0;
}


const CHANNEL_KINDS = {
  chat: {
    categoryField: 'clanChatCategoryId',
    idField: 'chatChannelId',
    createdField: 'chatChannelCreated',
    types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    create: ChannelType.GuildText,
  },
  voice: {
    categoryField: 'clanVoiceCategoryId',
    idField: 'voiceChannelId',
    createdField: 'voiceChannelCreated',
    types: [ChannelType.GuildVoice, ChannelType.GuildStageVoice],
    create: ChannelType.GuildVoice,
  },
};

const P = PermissionFlagsBits;

async function setChannelCategory(guildId, kind, categoryId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { [CHANNEL_KINDS[kind].categoryField]: categoryId } });
  invalidateGuildConfig(guildId);
}

function resolveChannel(message, query, types) {
  if (!message.guild || !query) return null;
  const mention = String(query).match(/^<#(\d+)>$/);
  const id = mention ? mention[1] : /^\d{15,25}$/.test(query) ? query : null;
  if (id) {
    const byId = message.guild.channels.cache.get(id);
    return byId && types.includes(byId.type) ? byId : null;
  }
  const clean = String(query).toLowerCase();
  return message.guild.channels.cache.find((c) => types.includes(c.type) && c.name.toLowerCase() === clean) || null;
}

async function provisionChannels(guild, clan, config) {
  const set = {};
  for (const [kind, spec] of Object.entries(CHANNEL_KINDS)) {
    const category = config[spec.categoryField] && guild.channels.cache.get(config[spec.categoryField]);
    if (!category || category.type !== ChannelType.GuildCategory) continue;
    const allow = kind === 'chat' ? [P.ViewChannel, P.SendMessages, P.ReadMessageHistory] : [P.ViewChannel, P.Connect, P.Speak];
    const channel = await guild.channels
      .create({
        name: clan.name,
        type: spec.create,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.id, deny: [P.ViewChannel] },
          { id: clan.roleId, allow },
          { id: guild.members.me.id, allow: [P.ViewChannel, P.ManageChannels] },
        ],
        reason: 'Clan created',
      })
      .catch((error) => {
        console.error(`Could not create the clan ${kind} channel:`, error.message);
        return null;
      });
    if (channel) Object.assign(set, { [spec.idField]: channel.id, [spec.createdField]: true });
  }
  if (Object.keys(set).length) {
    await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: set });
    Object.assign(clan, set);
  }
}

async function setClanChannel(guild, clan, kind, channel) {
  const spec = CHANNEL_KINDS[kind];
  if (clan[spec.idField] === channel.id) return `That is already the clan ${kind} channel`;
  const previous = clan[spec.createdField] ? guild.channels.cache.get(clan[spec.idField]) : null;
  await clans().updateOne(
    { guildId: guild.id, clanId: clan.clanId },
    { $set: { [spec.idField]: channel.id, [spec.createdField]: false } },
  );
  if (previous) await previous.delete('Clan channel replaced').catch(() => {});
  return null;
}


async function forceAddMember(guild, clan, userId) {
  if (clan.memberIds.includes(userId)) return 'That user is already in this clan';
  const other = await getClanOf(guild.id, userId);
  if (other) {
    if (other.leaderId === userId) return `That user leads another clan (**${other.name}**)`;
    await removeMember(guild, other, userId);
  }
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $addToSet: { memberIds: userId } });
  await applyRank(guild, await getGuildConfig(guild.id), clan, userId, 'member');
  if (clan.tag) await applyClanTag(guild, clan, userId);
  logClan(guild, `<@${userId}> __was added to__ **${clan.name}**`);
  return null;
}

async function leaveClan(guild, clan, userId) {
  if (clan.leaderId === userId) return "You lead this clan - use `&switchleader` first, or ask an admin to delete it";
  return removeMember(guild, clan, userId);
}

async function resetHours(guildId, clanId = null) {
  const result = await clans().updateMany(clanId === null ? { guildId } : { guildId, clanId }, { $set: { hoursMs: {} } });
  return result.matchedCount;
}

async function warnClan(guild, clan) {
  const result = await clans().findOneAndUpdate(
    { guildId: guild.id, clanId: clan.clanId },
    { $inc: { warnings: 1 } },
    { returnDocument: 'after' },
  );
  return unwrap(result).warnings;
}

async function notifyLeadersOfWarning(guild, clan, total) {
  const ids = [clan.leaderId, ...clan.coleaderIds];
  const dm = { flags: COMPONENTS_V2, components: [container({
    title: 'Clan Warning',
    lines: [`__Your clan__ **${clan.name}** __was warned in__ **${guild.name}**`, `__Warnings__ : ${total}`],
  })] };
  let sent = 0;
  for (const id of ids) {
    const user = await guild.client.users.fetch(id).catch(() => null);
    if (user && await user.send(dm).then(() => true, () => false)) sent += 1;
  }
  return { sent, total: ids.length };
}

const totalHoursMs = (clan) => Object.values(clan.hoursMs || {}).reduce((sum, ms) => sum + ms, 0);

async function topClans(guildId) {
  return (await listClans(guildId)).sort((a, b) => totalHoursMs(b) - totalHoursMs(a));
}

async function topClansGlobal() {
  return (await clans().find({}).toArray()).sort((a, b) => totalHoursMs(b) - totalHoursMs(a)).slice(0, 100);
}

async function configureSetupRole(message, kind, query) {
  const names = { leader: 'leader', coleader: 'co-leader' };
  const other = kind === 'leader' ? 'coleader' : 'leader';
  const { guild } = message;
  const config = await getGuildConfig(guild.id);

  const role = resolveRole(message, query);
  if (!role) return notice(message, "__Couldn't find that role__");
  const hierarchy = checkRoleTarget(message, role);
  const problem = roleProblem(guild, role)
    || (hierarchy.ok ? null : hierarchy.reason)
    || (setupRoleId(config, other) === role.id ? `already the ${names[other]} role` : null);
  if (problem) return rejectRole(message, role, problem);

  const previous = setupRoleId(config, kind);
  await setSetupRole(guild.id, kind, role.id);
  await resyncRanks(guild, previous && previous !== role.id ? previous : null);
  return card(message, { title: 'Clan Setup', lines: [`__Set the ${names[kind]} role to__ ${role}`] });
}


async function setLogChannel(guildId, channelId) {
  await getGuildConfig(guildId);
  await guildConfigs().updateOne({ guildId }, { $set: { clanLogChannelId: channelId } });
  invalidateGuildConfig(guildId);
}

async function logClan(guild, line) {
  try {
    const config = await getGuildConfig(guild.id);
    const channel = config.clanLogChannelId && guild.channels.cache.get(config.clanLogChannelId);
    if (!channel || !channel.isTextBased()) return;
    await channel.send({
      flags: COMPONENTS_V2,
      components: [container({ title: 'Clan Log', lines: [line] })],
      allowedMentions: { parse: [] },
      noTheme: true,
    });
  } catch (error) {
    console.error('Could not write the clan log:', error.message);
  }
}

const TAG_MAX = 10;
const TAG_PREFIX = /^\[[^\]]{1,10}\]\s*/;
const TAG_SUFFIX = /\s*\[[^\]]{1,10}\]$/;
const stripTag = (name) => name.replace(TAG_PREFIX, '').replace(TAG_SUFFIX, '');

async function applyClanTag(guild, clan, userId) {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member || member.user.bot) return false;

  const base = stripTag(member.nickname ?? member.user.username);
  const wanted = clan.tag
    ? (clan.tagPosition === 'suffix' ? `${base} [${clan.tag}]` : `[${clan.tag}] ${base}`).slice(0, 32)
    : base === member.user.username ? null : base;
  if ((wanted ?? null) === (member.nickname ?? null)) return true;
  return member.setNickname(wanted, clan.tag ? 'Clan tag applied' : 'Clan tag removed').then(() => true, () => false);
}

const clearClanTag = (guild, userId) => applyClanTag(guild, { tag: null }, userId);

async function setClanTag(guild, clan, tag, position = 'prefix') {
  if (tag !== null && !/^[^\[\]\s]{1,10}$/.test(tag)) return `The tag must be 1-${TAG_MAX} characters, without spaces or brackets`;
  const update = { tag, tagPosition: position };
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: update });
  let failed = 0;
  for (const userId of clan.memberIds) {
    if (!(await applyClanTag(guild, { ...clan, ...update }, userId))) failed += 1;
  }
  return { failed };
}

async function setClanColor(guild, clan, hex) {
  const clean = String(hex).replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 'The colour must be a hex code like `ff8800`';
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { color: clean.toLowerCase() } });
  await guild.roles.cache.get(clan.roleId)?.setColor(parseInt(clean, 16), 'Clan colour changed').catch(() => {});
  return null;
}

async function setClanAvatar(guild, clan, url) {
  if (url !== null && !/^https:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(url)) return 'The avatar must be a direct https link to an image (png, jpg, gif or webp)';
  await clans().updateOne({ guildId: guild.id, clanId: clan.clanId }, { $set: { avatarUrl: url } });
  return null;
}


const voiceSessions = new Map();
const sessionKey = (guildId, userId) => `${guildId}:${userId}`;

async function startVoiceSession(guildId, userId, channelId) {
  const clan = await clans().findOne({ guildId, voiceChannelId: channelId, memberIds: userId });
  if (clan) voiceSessions.set(sessionKey(guildId, userId), { startedAt: Date.now(), clanId: clan.clanId });
}

async function endVoiceSession(guildId, userId) {
  const key = sessionKey(guildId, userId);
  const session = voiceSessions.get(key);
  if (!session) return;
  voiceSessions.delete(key);
  const spent = Date.now() - session.startedAt;
  if (spent <= 0) return;
  await clans()
    .updateOne({ guildId, clanId: session.clanId, memberIds: userId }, { $inc: { [`hoursMs.${userId}`]: spent } })
    .catch(() => {});
}

async function rehydrateVoiceSessions(client) {
  for (const guild of client.guilds.cache.values()) {
    for (const clan of await clans().find({ guildId: guild.id, voiceChannelId: { $type: 'string' } }).toArray().catch(() => [])) {
      const channel = guild.channels.cache.get(clan.voiceChannelId);
      if (!channel || !channel.isVoiceBased()) continue;
      for (const member of channel.members.values()) {
        if (!member.user.bot) await startVoiceSession(guild.id, member.id, channel.id);
      }
    }
  }
}


async function addVoiceTime(guildId, userId, ms) {
  if (ms <= 0) return;
  await clans().updateOne({ guildId, memberIds: userId }, { $inc: { [`hoursMs.${userId}`]: ms } });
}

async function handleMemberLeft(member) {
  const { guild } = member;
  const clan = await getClanOf(guild.id, member.id);
  if (!clan) return;

  if (clan.leaderId !== member.id) {
    await removeMember(guild, clan, member.id);
    return;
  }
  const [successor, ...restCoLeaders] = clan.coleaderIds;
  if (!successor) return deleteClan(guild, clan);

  await clans().updateOne(
    { guildId: guild.id, clanId: clan.clanId },
    {
      $set: { leaderId: successor, coleaderIds: restCoLeaders },
      $pull: { memberIds: member.id },
      $unset: { [`hoursMs.${member.id}`]: '' },
    },
  );
  await applyRank(guild, await getGuildConfig(guild.id), clan, successor, 'leader');
}


async function requireManager(message) {
  const config = await getGuildConfig(message.guild.id);
  if (canManageClans(message.member, config)) return config;
  await notice(message, "__You don't have permission__");
  return null;
}

async function requireClanRank(message, { leaderOnly = false } = {}) {
  const clan = await getClanOf(message.guild.id, message.author.id);
  const rank = clan && rankOf(clan, message.author.id);
  if (rank === 'leader' || (rank === 'coleader' && !leaderOnly)) return clan;
  await notice(message, leaderOnly ? '__You are not a clan leader__' : "__You're not a leader or co-leader of any clan__");
  return null;
}

const waitText = (ms) => (ms < 60000 ? `${Math.ceil(ms / 1000)}s` : `${Math.ceil(ms / 60000)}m`);

async function tooSoon(message, key, ms) {
  const cd = peek(key, ms);
  if (!cd.onCooldown) return false;
  await notice(message, `__Slow down, try again in ${waitText(cd.remainingMs)}__`);
  return true;
}

const rejectRole = (message, role, reason) =>
  notice(message, [`__Couldn't use__ ${role}`, `__Reason__ : ${reason}`]);

module.exports = {
  DEFAULT_MEMBER_LIMIT,
  PREMIUM_MEMBER_LIMIT,
  DEFAULT_COLEADER_LIMIT,
  MAX_MANAGER_ROLES,
  NAME_MIN,
  NAME_MAX,
  parseClanId,
  parseCount,
  getClan,
  getClanOf,
  listClans,
  rankOf,
  canManageClans,
  managerRoleIds,
  setupRoleId,
  setSetupRole,
  addManagerRole,
  removeManagerRole,
  roleProblem,
  resyncRanks,
  validateName,
  createClan,
  deleteClan,
  addMember,
  removeMember,
  promoteCoLeader,
  demoteCoLeader,
  transferLeader,
  renameClan,
  setMemberLimit,
  setCoLeaderLimit,
  setMemberHours,
  setClanRole,
  clearWarnings,
  CHANNEL_KINDS,
  setChannelCategory,
  resolveChannel,
  setClanChannel,
  forceAddMember,
  leaveClan,
  resetHours,
  warnClan,
  notifyLeadersOfWarning,
  totalHoursMs,
  topClans,
  topClansGlobal,
  configureSetupRole,
  addVoiceTime,
  setLogChannel,
  logClan,
  TAG_MAX,
  applyClanTag,
  setClanTag,
  setClanColor,
  setClanAvatar,
  startVoiceSession,
  endVoiceSession,
  rehydrateVoiceSessions,
  handleMemberLeft,
  requireManager,
  requireClanRank,
  tooSoon,
  startCooldown,
  rejectRole,
};
