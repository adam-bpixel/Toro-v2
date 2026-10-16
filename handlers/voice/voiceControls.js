'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { settingsOf } = require('./tempvoice');
const cooldown = require('../../utils/runtime/cooldown');
const { ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { ownerOf, actions, INFO_BANNER } = require('./voiceActions');

const ACTION_COOLDOWN_MS = 3000;
const RENAME_COOLDOWN_MS = 300_000;
const OPEN_TO_ALL = new Set(['claim', 'owner', 'info']);

const wait = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)}m ${Math.ceil((ms % 60000) / 1000)}s` : `${Math.ceil(ms / 1000)}s`);

const containerPayload = (components) => ({
  flags: COMPONENTS_V2,
  components: [{ type: 17, accent_color: ACCENT_COLOR, components, spoiler: false }],
});

async function run(action, member, extra = {}) {
  const room = member.voice.channel;
  const rooms = (await settingsOf(member.guild.id)).channelIds || [];
  if (!room || !rooms.includes(room.id)) return { error: 'You must be in a temporary voice channel' };
  if (!member.guild.members.me.permissionsIn(room).has(PermissionFlagsBits.ManageChannels)) {
    return { error: 'I need the **Manage Channels** permission in your channel' };
  }

  const owner = ownerOf(room);
  const busy = cooldown.hit(`voice:${member.guild.id}:${member.id}`, ACTION_COOLDOWN_MS);
  if (busy.onCooldown) return { error: `Please wait ${wait(busy.remainingMs)} before using another voice command` };

  if (!Object.hasOwn(actions, action)) return { error: 'Unknown voice action' };
  if (!OPEN_TO_ALL.has(action) && (!owner || owner.id !== member.id)) {
    return { error: owner ? `Only the channel owner (${owner.displayName}) can do that` : 'This channel has no owner, use `claim`' };
  }

  if (action === 'name') {
    const renamed = cooldown.peek(`voice-rename:${room.id}`, RENAME_COOLDOWN_MS);
    if (renamed.onCooldown) return { error: `You can rename this channel again in ${wait(renamed.remainingMs)}` };
    cooldown.start(`voice-rename:${room.id}`);
  }

  try {
    return await actions[action]({ room, owner, member, ...extra });
  } catch (error) {
    return { error: `Discord refused it : ${error.rawError?.message || error.message}` };
  }
}

module.exports = {
  run,
  ownerOf,
  actions,
  containerPayload,
  INFO_BANNER,
};
