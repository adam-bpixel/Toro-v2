'use strict';
const { AuditLogEvent, Events, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../models/core/moderation');
const { isPremium, isOwner, serverAllowed } = require('../../models/economy/premium');
const { audit } = require('./logs');
const { card, notice } = require('../../utils/render/embeds');
const { resolveRole } = require('../../utils/access/resolve');
const { replay } = require('../../utils/runtime/replay');
const { prefixesFor } = require('../../models/settings/prefix');

const INVITE = /(?:discord(?:app)?\.com\/invite|discord\.gg|dsc\.gg)\/[\w-]+/i;

const cache = new Map();
async function settingsOf(guildId) {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < 30_000) return hit.value;
  const value = (await getGuildConfig(guildId)).protection || {};
  cache.set(guildId, { at: Date.now(), value });
  return value;
}

async function isOn(guild, key) {
  const settings = await settingsOf(guild.id);
  return Boolean(settings[key]) && isPremium('server', guild.id);
}

async function setProtection(guildId, field, value) {
  await updateGuildConfig(guildId, { $set: { [`protection.${field}`]: value } });
  cache.delete(guildId);
}

function registerProtection(client) {
  const guard = (event, handler) => client.on(event, (...args) => Promise.resolve(handler(...args)).catch((error) => console.error(`Protection ${event} failed:`, error)));

  guard(Events.GuildMemberAdd, async (member) => {
    if (!member.user.bot || member.id === client.user.id || !(await isOn(member.guild, 'antibot'))) return;
    const entry = await audit(member.guild, [AuditLogEvent.BotAdd], (e) => e.targetId === member.id);
    if (entry?.executorId === member.guild.ownerId) return;
    await member.kick(`Anti-bot: added by ${entry?.executorId || 'unknown'}`);
  });

  guard(Events.WebhooksUpdate, async (channel) => {
    if (!(await isOn(channel.guild, 'antiwebhook'))) return;
    const entry = await audit(channel.guild, [AuditLogEvent.WebhookCreate]);
    if (!entry || entry.executorId === channel.guild.ownerId || entry.executorId === client.user.id) return;
    const webhooks = await channel.fetchWebhooks().catch(() => null);
    const webhook = webhooks?.get(entry.targetId);
    if (webhook) await webhook.delete(`Anti-webhook: created by ${entry.executorId}`);
  });

  guard(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot || !INVITE.test(message.content) || !(await isOn(message.guild, 'antiinvite'))) return;
    const member = message.member;
    if (!member || member.permissions.has(PermissionFlagsBits.ManageGuild) || isOwner(message.author.id)) return;
    const exempt = (await settingsOf(message.guild.id)).inviteRoleIds || [];
    if (exempt.some((id) => member.roles.cache.has(id))) return;
    await message.delete();
    const warning = await message.channel.send({ content: `- __${message.author}, invite links aren't allowed here__  ⁘`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
    if (warning) setTimeout(() => warning.delete().catch(() => {}), 5000).unref();
  });
}

function protectionCommand({ name, key, label, summary, roles = false }) {
  return {
    name,
    aliases: [],
    description: summary,
    usage: roles ? '[on|off|add <role>|remove <role>]' : '[on|off]',
    category: 'Premium Commands',
    async execute(message, args) {
      if (!(await serverAllowed(message))) return replay(message, this, args);

      const settings = await settingsOf(message.guild.id);
      const first = (args[0] || '').toLowerCase();
      const on = Boolean(settings[key]);
      const exempt = settings.inviteRoleIds || [];

      if (!first || first === 'status') {
        const { server, personal } = await prefixesFor(message.guild.id, message.author.id);
        const lines = [`__Status__ : ${on ? 'Enabled' : 'Disabled'}`, `__Usage__ : \`${personal || server}${name} <on|off>\``];
        if (roles) lines.splice(1, 0, `__Exempt roles__ : ${exempt.length ? exempt.map((id) => `<@&${id}>`).join(' ') : 'None'}`);
        return card(message, { title: label, lines });
      }

      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return notice(message, "__You don't have permission__");

      if (first === 'on' || first === 'off') {
        if ((first === 'on') === on) return notice(message, `__${label} is already ${on ? 'enabled' : 'disabled'}__`);
        await setProtection(message.guild.id, key, first === 'on');
        return card(message, { title: label, lines: [`__${label} ${first === 'on' ? 'enabled' : 'disabled'}__`] });
      }

      if (roles && (first === 'add' || first === 'remove')) {
        const role = resolveRole(message, args.slice(1).join(' '));
        if (!role) return notice(message, "__Couldn't find that role__");
        const has = exempt.includes(role.id);
        if (first === 'add' && has) return notice(message, `__${role} is already exempt__`);
        if (first === 'remove' && !has) return notice(message, `__${role} isn't exempt__`);
        await setProtection(message.guild.id, 'inviteRoleIds', first === 'add' ? [...exempt, role.id] : exempt.filter((id) => id !== role.id));
        return card(message, { title: label, lines: [`__${first === 'add' ? 'Added' : 'Removed'}__ ${role} __${first === 'add' ? 'to' : 'from'} the exempt roles__`] });
      }

      return notice(message, `__Use \`${name} on\` or \`${name} off\`__`);
    },
  };
}

module.exports = { registerProtection, protectionCommand };
