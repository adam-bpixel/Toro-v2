'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../core/db');
const { getGuildConfig } = require('../core/moderation');
const { resolveUser } = require('../../utils/access/resolve');
const { card, notice, usageCard, container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');

const logs = () => getDb().collection('verificationLogs');
const COOLDOWN_MS = 10000;
const PAGE_SIZE = 5;
const PINK = 0xff6fcf;
const BLUE = 0x3b9dff;

const canVerify = (member, config) => member.permissions.has(PermissionFlagsBits.ManageRoles)
  || member.roles.cache.some((role) => (config.verificatorRoleIds || []).includes(role.id));

async function grant(message, args, kind) {
  const command = kind === 'boy' ? 'vb' : 'vg';
  if (!args.length) {
    return usageCard(message, { summary: `Grant verification to a ${kind}`, usage: `&${command} <ID|@member|username>`, notes: ['Cooldown: 10 seconds'] });
  }
  const config = await getGuildConfig(message.guild.id);
  if (!canVerify(message.member, config)) return notice(message, "__You don't have permission__");
  const settings = config.verification || {};
  const roleId = kind === 'boy' ? settings.boyRoleId : settings.girlRoleId;
  const role = roleId && message.guild.roles.cache.get(roleId);
  if (!role) return notice(message, '__The verification system is not configured yet - use `/setup-verification`__');

  const target = await resolveUser(message, args, { fallbackToAuthor: false });
  if (!target) return notice(message, "__Couldn't find that user__");
  const member = await message.guild.members.fetch(target.id).catch(() => null);
  if (!member) return notice(message, "__That member isn't in this server__");
  if (config.jailRoleId && member.roles.cache.has(config.jailRoleId)) return notice(message, `__**${target.username}** is jailed - unjail them first__`);
  if (member.roles.cache.has(role.id)) return notice(message, `__**${target.username}** is already verified as a ${kind}__`);

  const cooldown = hit(`verify:${message.author.id}`, COOLDOWN_MS);
  if (cooldown.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cooldown.remainingMs / 1000)}s__`);

  const opposite = kind === 'boy' ? settings.girlRoleId : settings.boyRoleId;
  const done = await member.roles.add(role, `Verified as ${kind} by ${message.author.tag || message.author.username}`).then(() => true).catch(() => false);
  if (!done) return notice(message, "__Couldn't give the role (check my role position/permissions)__");
  if (opposite && member.roles.cache.has(opposite)) await member.roles.remove(opposite).catch(() => {});
  if (settings.unverifiedRoleId && member.roles.cache.has(settings.unverifiedRoleId)) {
    await member.roles.remove(settings.unverifiedRoleId, `Verified as ${kind}`).catch(() => {});
  }

  await logs().insertOne({ guildId: message.guild.id, userId: target.id, verifierId: message.author.id, kind, createdAt: new Date() });

  const now = Math.floor(Date.now() / 1000);
  await target.send({
    flags: COMPONENTS_V2,
    components: [container({
      accentColor: kind === 'girl' ? PINK : BLUE,
      title: `${kind === 'girl' ? '♀️' : '♂️'} Verified`,
      lines: [`__You have been verified as a__ **${kind}** __in__ **${message.guild.name}**`, `__Role__ : ${role}`],
    })],
    allowedMentions: { parse: [] },
  }).catch(() => {});

  const logChannel = settings.logChannelId && message.guild.channels.cache.get(settings.logChannelId);
  if (logChannel && logChannel.isTextBased()) {
    logChannel.send({
      flags: COMPONENTS_V2,
      components: [container({
        accentColor: kind === 'girl' ? PINK : BLUE,
        title: 'Verification',
        lines: [
          `__Member__ : <@${target.id}> \`${target.username}\``,
          `__Verified as__ : ${kind}`,
          `__Verifier__ : <@${message.author.id}>`,
          `__Time__ : <t:${now}:F> • <t:${now}:R>`,
        ],
      })],
      allowedMentions: { parse: [] },
    }).catch(() => {});
  }
  return card(message, { title: 'Verification', lines: [`__Verified__ **${target.username}** __as a ${kind}__`, `__Role__ : ${role}`] });
}

function topVerifiers(guildId, limit = 100) {
  return logs().aggregate([
    { $match: { guildId } },
    { $group: { _id: '$verifierId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]).toArray();
}

async function showLogs(message, args) {
  if (!args.length) {
    return usageCard(message, { summary: 'View verification logs', usage: '&veriflogs <ID|@member|username> [page]', notes: ['5 logs per page'] });
  }
  const config = await getGuildConfig(message.guild.id);
  if (!canVerify(message.member, config)) return notice(message, "__You don't have permission__");
  const target = await resolveUser(message, args, { fallbackToAuthor: false });
  if (!target) return notice(message, "__Couldn't find that user__");
  const last = Number(args[args.length - 1]);
  const requested = Number.isInteger(last) && last > 0 && args.length > 1 ? last : 1;

  const filter = { guildId: message.guild.id, userId: target.id };
  const total = await logs().countDocuments(filter);
  if (!total) return notice(message, `__No verification logs for **${target.username}**__`);
  const pages = Math.ceil(total / PAGE_SIZE);
  const page = Math.min(requested, pages);
  const rows = await logs().find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray();
  return card(message, {
    title: `Verification Logs - ${target.username}`,
    lines: [
      ...rows.map((row) => `__${row.kind}__ by <@${row.verifierId}> <t:${Math.floor(row.createdAt.getTime() / 1000)}:R>`),
      `__Page ${page}/${pages}__ (\`${total}\` logs)`,
    ],
  });
}

async function show(message) {
  const config = await getGuildConfig(message.guild.id);
  const settings = config.verification || {};
  const roleText = (id) => (id && message.guild.roles.cache.get(id) ? `${message.guild.roles.cache.get(id)}` : '`not set`');
  const channelText = (id) => (id && message.guild.channels.cache.get(id) ? `${message.guild.channels.cache.get(id)}` : '`not set`');
  const verificators = (config.verificatorRoleIds || []).map((id) => message.guild.roles.cache.get(id)).filter(Boolean);
  return card(message, {
    title: 'Verification System',
    lines: [
      `__Boy role__ : ${roleText(settings.boyRoleId)}`,
      `__Girl role__ : ${roleText(settings.girlRoleId)}`,
      `__Unverified role__ : ${roleText(settings.unverifiedRoleId)}`,
      `__Log channel__ : ${channelText(settings.logChannelId)}`,
      `__Verificator roles__ : ${verificators.length ? verificators.join(' ') : '`none`'}`,
      `__Verified so far__ : \`${await logs().countDocuments({ guildId: message.guild.id })}\``,
    ],
  });
}

module.exports = { grant, showLogs, show, topVerifiers };
