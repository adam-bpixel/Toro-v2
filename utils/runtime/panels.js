'use strict';
const { COMPONENTS_V2 } = require('../render/embeds');

async function disablePanelMessage(guild, channelId, messageId) {
  if (!channelId || !messageId) return;
  const channel = guild.channels.cache.get(channelId);
  const message = channel && (await channel.messages.fetch(messageId).catch(() => null));
  if (!message || !message.components.length) return;

  const off = (node) => {
    if (Array.isArray(node)) return node.map(off);
    if (!node || typeof node !== 'object') return node;
    const out = Object.fromEntries(Object.entries(node).map(([key, value]) => [key, off(value)]));
    if (out.type === 3 || (out.type === 2 && out.custom_id)) out.disabled = true;
    return out;
  };
  await message.edit({ flags: COMPONENTS_V2, components: off(message.components.map((c) => c.toJSON())) }).catch(() => {});
}

module.exports = { disablePanelMessage };
