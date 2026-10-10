'use strict';
const { ChannelType, Events, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../models/core/moderation');
const { isPremium } = require('../../models/economy/premium');

const cache = new Map();
async function settingsOf(guildId) {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < 30_000) return hit.value;
  const value = (await getGuildConfig(guildId)).tempVoice || {};
  cache.set(guildId, { at: Date.now(), value });
  return value;
}
const forget = (guildId) => cache.delete(guildId);

const saveHub = async (guildId, hubId) => {
  await updateGuildConfig(guildId, hubId ? { $set: { 'tempVoice.hubId': hubId } } : { $unset: { 'tempVoice.hubId': '' } });
  forget(guildId);
};
const saveSetup = async (guildId, { hubId, interfaceId, nameTemplate }) => {
  const set = { 'tempVoice.hubId': hubId };
  const unset = {};
  if (interfaceId) set['tempVoice.interfaceId'] = interfaceId; else unset['tempVoice.interfaceId'] = '';
  if (nameTemplate) set['tempVoice.nameTemplate'] = nameTemplate; else unset['tempVoice.nameTemplate'] = '';
  await updateGuildConfig(guildId, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
  forget(guildId);
};

const roomName = (member, template) => {
  const text = String(template || '').trim();
  const name = text
    ? text.replace(/{user}/gi, member.displayName).replace(/{username}/gi, member.user.username)
    : member.displayName;
  return (name.trim() || member.displayName).slice(0, 100);
};

const trackRoom = async (guildId, channelId) => {
  await updateGuildConfig(guildId, { $addToSet: { 'tempVoice.channelIds': channelId } });
  forget(guildId);
};
const untrackRoom = async (guildId, channelId) => {
  await updateGuildConfig(guildId, { $pull: { 'tempVoice.channelIds': channelId } });
  forget(guildId);
};

function registerTempVoice(client) {
  client.on(Events.VoiceStateUpdate, async (before, after) => {
    try {
      const guild = after.guild;
      if (before.channelId === after.channelId) return;
      const settings = await settingsOf(guild.id);
      if (!settings.hubId && !(settings.channelIds || []).length) return;
      const premium = await isPremium('server', guild.id);

      if (premium && settings.hubId && after.channelId === settings.hubId && after.member && !after.member.user.bot) {
        const hub = after.channel;
        const room = await guild.channels.create({
          name: roomName(after.member, settings.nameTemplate),
          type: ChannelType.GuildVoice,
          parent: hub.parentId,
          bitrate: hub.bitrate,
          userLimit: hub.userLimit,
          permissionOverwrites: [
            { id: after.member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] },
            { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] },
          ],
          reason: 'Temporary voice channel',
        });
        await trackRoom(guild.id, room.id);
        const moved = await after.member.voice.setChannel(room).then(() => true).catch(async () => {
          await room.delete().catch(() => {});
          await untrackRoom(guild.id, room.id);
          return false;
        });
        if (moved) {
          const voicemaster = require('./voicemaster');
          await room.send(voicemaster.panelPayload(guild))
            .catch((error) => console.error(`Temp voice: could not send the control panel in ${room.name}:`, error.message));
        }
      }

      if (before.channelId && (settings.channelIds || []).includes(before.channelId)) {
        const room = before.channel || guild.channels.cache.get(before.channelId);
        if (!room) return untrackRoom(guild.id, before.channelId);
        if (room.members.size === 0) {
          await room.delete('Temporary voice channel is empty').catch(() => {});
          await untrackRoom(guild.id, room.id);
        }
      }
    } catch (error) {
      console.error('Temp voice failed:', error);
    }
  });
}

module.exports = { registerTempVoice, settingsOf, saveHub, saveSetup, roomName, forget };
