'use strict';
const { Events, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../models/core/db');

const joins = () => getDb().collection('inviteJoins');
const FAKE_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const uses = new Map();

async function snapshot(guild) {
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) return null;
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return null;
  const map = new Map([...invites.values()].map((i) => [i.code, { uses: i.uses || 0, inviterId: i.inviterId }]));
  uses.set(guild.id, map);
  return map;
}

function registerInviteTracker(client) {
  const safe = (event, handler) => client.on(event, (...args) => Promise.resolve(handler(...args)).catch((error) => console.error(`Invite tracker ${event} failed:`, error)));

  safe(Events.ClientReady, async () => { for (const guild of client.guilds.cache.values()) await snapshot(guild); });
  safe(Events.GuildCreate, (guild) => snapshot(guild));
  safe(Events.InviteCreate, (invite) => {
    if (invite.guild) uses.get(invite.guild.id)?.set(invite.code, { uses: invite.uses || 0, inviterId: invite.inviterId });
  });
  safe(Events.InviteDelete, (invite) => { if (invite.guild) uses.get(invite.guild.id)?.delete(invite.code); });

  safe(Events.GuildMemberAdd, async (member) => {
    const before = uses.get(member.guild.id);
    if (!before) return;
    const now = await snapshot(member.guild);
    if (!now) return;
    const used = [...now.entries()].find(([code, data]) => data.uses > (before.get(code)?.uses ?? 0))
      || [...before.entries()].find(([code, data]) => !now.has(code) && data.inviterId);
    if (!used || !used[1].inviterId || used[1].inviterId === member.id) return;
    const fake = member.user.bot || Date.now() - member.user.createdTimestamp < FAKE_ACCOUNT_AGE_MS;
    await joins().updateOne(
      { guildId: member.guild.id, memberId: member.id },
      { $set: { inviterId: used[1].inviterId, code: used[0], fake, left: false, at: new Date() } },
      { upsert: true },
    );
  });

  safe(Events.GuildMemberRemove, (member) => joins().updateOne({ guildId: member.guild.id, memberId: member.id }, { $set: { left: true } }));
}

async function topInviters(guildId, limit = 100) {
  return joins().aggregate([
    { $match: { guildId } },
    {
      $group: {
        _id: '$inviterId',
        left: { $sum: { $cond: ['$left', 1, 0] } },
        fake: { $sum: { $cond: [{ $and: [{ $not: ['$left'] }, '$fake'] }, 1, 0] } },
        invites: { $sum: { $cond: [{ $or: ['$left', '$fake'] }, 0, 1] } },
      },
    },
    { $sort: { invites: -1, fake: 1, left: 1 } },
    { $limit: limit },
  ]).toArray();
}

async function statsFor(guildId, userId) {
  const [row] = await joins().aggregate([
    { $match: { guildId, inviterId: userId } },
    {
      $group: {
        _id: null,
        left: { $sum: { $cond: ['$left', 1, 0] } },
        fake: { $sum: { $cond: [{ $and: [{ $not: ['$left'] }, '$fake'] }, 1, 0] } },
        valid: { $sum: { $cond: [{ $or: ['$left', '$fake'] }, 0, 1] } },
      },
    },
  ]).toArray();
  return { valid: row?.valid || 0, fake: row?.fake || 0, left: row?.left || 0 };
}

module.exports = { registerInviteTracker, topInviters, statsFor };
