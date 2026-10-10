'use strict';
const { PermissionFlagsBits, OverwriteType } = require('discord.js');
const { VOICE_EMOJI } = require('../../utils/emojis');

const INFO_BANNER = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553556444643590175/ezgif-7330ede79c09b445.gif?ex=6ab9adb0&is=6ab85c30&hm=31df96012026a1cf3e5df252744eac73ac52f7a41ed08e83fc48987dca467edc&';
const OWNER_PERMS = { ManageChannels: true, MoveMembers: true, ViewChannel: true, Connect: true };

function activeFor(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const ownerOf = (room) => {
  const entry = room.permissionOverwrites.cache.find((o) => o.type === OverwriteType.Member && o.allow.has(PermissionFlagsBits.ManageChannels));
  return entry ? room.guild.members.cache.get(entry.id) || null : null;
};

const setEveryone = (room, perms) => room.permissionOverwrites.edit(room.guild.roles.everyone, perms);

const actions = {
  async lock({ room, owner }) {
    if (owner) await room.permissionOverwrites.edit(owner.id, OWNER_PERMS);
    await setEveryone(room, { Connect: false });
    return { text: 'Your channel is locked' };
  },
  async unlock({ room }) {
    await setEveryone(room, { Connect: null });
    return { text: 'Your channel is unlocked' };
  },
  async ghost({ room, owner }) {
    if (owner) await room.permissionOverwrites.edit(owner.id, OWNER_PERMS);
    await setEveryone(room, { ViewChannel: false });
    return { text: 'Your channel is hidden' };
  },
  async reveal({ room }) {
    await setEveryone(room, { ViewChannel: null });
    return { text: 'Your channel is visible again' };
  },
  async name({ room, value }) {
    const name = String(value || '').trim();
    if (!name) return { error: 'Give the new name' };
    await room.setName(name.slice(0, 100));
    return { text: `Your channel was renamed to **${name.slice(0, 100)}**` };
  },
  async limit({ room, value }) {
    const limit = Number(value);
    if (!/^\d{1,2}$/.test(String(value ?? '')) || limit > 99) return { error: 'The limit must be a number from 0 to 99' };
    await room.setUserLimit(limit);
    return { text: limit ? `The limit is now \`${limit}\`` : 'The limit was removed' };
  },
  async increase({ room }) {
    if (room.userLimit >= 99) return { error: 'The limit is already at the maximum (99)' };
    await room.setUserLimit(room.userLimit + 1);
    return { text: `The limit is now \`${room.userLimit + 1}\`` };
  },
  async decrease({ room }) {
    if (room.userLimit === 0) return { error: 'There is no limit to decrease' };
    await room.setUserLimit(room.userLimit - 1);
    return { text: room.userLimit - 1 ? `The limit is now \`${room.userLimit - 1}\`` : 'The limit was removed' };
  },
  async claim({ room, owner, member }) {
    if (owner && owner.id === member.id) return { error: 'You already own this channel' };
    if (owner && room.members.has(owner.id)) return { error: `**${owner.displayName}** is still in the channel` };
    if (owner) await room.permissionOverwrites.delete(owner.id);
    await room.permissionOverwrites.edit(member.id, OWNER_PERMS);
    return { text: 'You are now the owner of this channel' };
  },
  async kick({ room, member, target }) {
    const inRoom = target && room.members.get(target.id);
    if (!inRoom) return { error: 'That member is not in your channel' };
    if (inRoom.id === member.id) return { error: 'You cannot kick yourself' };
    await inRoom.voice.disconnect('Kicked by the temporary voice owner');
    return { text: `**${inRoom.displayName}** was kicked from your channel` };
  },
  async deny({ room, member, owner, target }) {
    if (!target) return { error: 'Member not found' };
    if (target.id === member.id) return { error: 'You cannot deny yourself' };
    if (target.id === room.client.user.id || (owner && target.id === owner.id)) return { error: 'You cannot deny that member' };
    await room.permissionOverwrites.edit(target.id, { Connect: false });
    const inRoom = room.members.get(target.id);
    if (inRoom) await inRoom.voice.disconnect('Denied by the temporary voice owner');
    return { text: `**${inRoom ? inRoom.displayName : target.username}** was kicked and can no longer join your channel` };
  },
  async perm({ room, target, role }) {
    const who = role || target;
    if (!who) return { error: 'Member or role not found' };
    if (role && role.id === room.guild.id) return { error: 'Use `unlock` and `reveal` to open the channel to everyone' };
    await room.permissionOverwrites.edit(who.id, { Connect: true, ViewChannel: true });
    return { text: `**${role ? role.name : target.username}** can now see and join your channel` };
  },
  async panel({ room }) {
    const voicemaster = require('./voicemaster');
    await room.send(voicemaster.panelPayload(room.guild));
    return { text: 'The panel was sent again in your channel' };
  },
  async activity({ room }) {
    const allowed = room.permissionsFor(room.guild.roles.everyone).has(PermissionFlagsBits.UseEmbeddedActivities);
    await setEveryone(room, { UseEmbeddedActivities: !allowed });
    return { text: allowed ? 'Activities are turned off' : 'Activities are turned on' };
  },
  async owner({ owner }) {
    return { text: owner ? `The owner is **${owner.displayName}** (${owner})` : 'This channel has no owner, use `claim`' };
  },
  async delete({ room }) {
    await room.delete('Deleted by the temporary voice owner');
    return { text: 'Your channel was deleted', deleted: true };
  },
  async info({ room, owner }) {
    const everyone = room.permissionsFor(room.guild.roles.everyone);
    const allowed = room.permissionOverwrites.cache.filter((o) => o.allow.has(PermissionFlagsBits.Connect) && o.id !== room.guild.id);
    const users = allowed.filter((o) => o.type === OverwriteType.Member && (!owner || o.id !== owner.id) && o.id !== room.client.user.id).size;
    const roles = allowed.filter((o) => o.type === OverwriteType.Role).size;
    const line = (text) => ({ type: 10, content: `- ${text}` });
    const divider = { type: 14, spacing: 1, divider: true };
    return {
      container: [
        { type: 10, content: `- ${VOICE_EMOJI.info} **Voice Channel Information**` },
        divider,
        { type: 12, items: [{ media: { url: INFO_BANNER }, description: null, spoiler: false }] },
        divider,
        line(`**Owner** : ${owner ? `${owner}` : '`None`'}`),
        line(`**Name** : ${room.name}`),
        line(`**Limit** : \`${room.userLimit ? room.userLimit : 'Unlimited'}\``),
        divider,
        line(`**Created At** : \`${room.createdAt.toLocaleString('en-US')}\``),
        line(`**Active For** : \`${activeFor(Date.now() - room.createdTimestamp)}\``),
        divider,
        line(`**Hidden** : \`${everyone.has(PermissionFlagsBits.ViewChannel) ? 'No' : 'Yes'}\``),
        line(`**Locked** : \`${everyone.has(PermissionFlagsBits.Connect) ? 'No' : 'Yes'}\``),
        divider,
        line(`**Permitted** : \`${users + roles}\` (Users: ${users}, Roles: ${roles})`),
      ],
    };
  },
};

module.exports = {
  OWNER_PERMS,
  INFO_BANNER,
  ownerOf,
  setEveryone,
  actions,
};
