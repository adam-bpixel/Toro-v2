'use strict';
const { Events } = require('discord.js');
const { getDb } = require('../core/db');
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider, bullet } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

const giveaways = () => getDb().collection('giveaways');
const ENTER_ID = 'giveaway_enter';
const MAX_TIMEOUT = 2 ** 31 - 1;
const timers = new Map();

const UNITS = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
function parseDuration(text) {
  const parts = String(text || '').toLowerCase().match(/(\d+)\s*([smhdw])/g);
  if (!parts || parts.join('').replace(/\s/g, '') !== String(text).toLowerCase().replace(/\s/g, '')) return null;
  const total = parts.reduce((sum, part) => sum + Number(part.match(/\d+/)[0]) * UNITS[part.slice(-1)], 0);
  return total > 0 ? total : null;
}

const pickWinners = (entries, count) => {
  const pool = [...entries];
  const winners = [];
  while (pool.length && winners.length < count) winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return winners;
};

function buildMessage(gw) {
  const ended = Boolean(gw.ended);
  const lines = [
    `__Hosted by__ : <@${gw.hostId}>`,
    `__Winners__ : \`${gw.winners}\``,
    `__Entries__ : \`${gw.entries.length}\``,
  ];
  if (ended) {
    lines.push(`__Won by__ : ${gw.winnerIds.length ? gw.winnerIds.map((id) => `<@${id}>`).join(', ') : '`nobody entered`'}`);
    lines.push(`__Ended__ : <t:${Math.floor(gw.endsAt / 1000)}:R>`);
  } else {
    lines.push(`__Ends__ : <t:${Math.floor(gw.endsAt / 1000)}:R>`);
  }
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${EMOJI.gift} ${gw.prize}`),
        divider(),
        textBlock(lines.map(bullet).join('\n')),
        divider(),
        {
          type: 1,
          components: [{
            type: 2, style: 2, custom_id: ENTER_ID, label: ended ? 'Ended' : 'Enter', disabled: ended,
            emoji: { id: '1551750411986149386', name: 'gift' },
          }],
        },
      ],
      spoiler: false,
    }],
  };
}

async function fetchMessage(client, gw) {
  const channel = await client.channels.fetch(gw.channelId).catch(() => null);
  const message = channel && channel.messages ? await channel.messages.fetch(gw.messageId).catch(() => null) : null;
  return { channel, message };
}

function arm(client, gw) {
  clearTimeout(timers.get(gw.messageId));
  if (gw.ended) return;
  const wait = Math.max(0, gw.endsAt - Date.now());
  const timer = setTimeout(() => (wait > MAX_TIMEOUT ? arm(client, gw) : end(client, gw.messageId).catch(() => {})), Math.min(wait, MAX_TIMEOUT));
  timer.unref();
  timers.set(gw.messageId, timer);
}

async function create(client, { guild, channel, hostId, prize, durationMs, winners }) {
  const gw = {
    guildId: guild.id, channelId: channel.id, messageId: null, prize, winners, hostId,
    endsAt: Date.now() + durationMs, entries: [], ended: false, winnerIds: [], createdAt: new Date(),
  };
  const sent = await channel.send(buildMessage(gw)).catch(() => null);
  if (!sent) return null;
  gw.messageId = sent.id;
  await giveaways().insertOne(gw);
  arm(client, gw);
  return { gw, message: sent };
}

const find = (guildId, messageId) => giveaways().findOne({ guildId, messageId: String(messageId) });

async function end(client, messageId) {
  const gw = await giveaways().findOne({ messageId, ended: false });
  if (!gw) return null;
  clearTimeout(timers.get(messageId));
  gw.ended = true;
  gw.endsAt = Math.min(gw.endsAt, Date.now());
  gw.winnerIds = pickWinners(gw.entries, gw.winners);
  await giveaways().updateOne({ _id: gw._id }, { $set: { ended: true, endsAt: gw.endsAt, winnerIds: gw.winnerIds } });
  const { channel, message } = await fetchMessage(client, gw);
  if (message) await message.edit(buildMessage(gw)).catch(() => {});
  if (channel) {
    await channel.send({
      content: gw.winnerIds.length
        ? `- ${EMOJI.gift} __Congratulations__ ${gw.winnerIds.map((id) => `<@${id}>`).join(', ')}__! You won **${gw.prize}**__  ⁘`
        : `- __Nobody entered the **${gw.prize}** giveaway__  ⁘`,
      allowedMentions: { users: gw.winnerIds },
    }).catch(() => {});
  }
  return gw;
}

async function reroll(client, gw) {
  const winnerIds = pickWinners(gw.entries, gw.winners);
  await giveaways().updateOne({ _id: gw._id }, { $set: { winnerIds } });
  const updated = { ...gw, winnerIds };
  const { channel, message } = await fetchMessage(client, gw);
  if (message) await message.edit(buildMessage(updated)).catch(() => {});
  if (channel) {
    await channel.send({
      content: winnerIds.length
        ? `- ${EMOJI.gift} __New winner${winnerIds.length > 1 ? 's' : ''}__ ${winnerIds.map((id) => `<@${id}>`).join(', ')}__! You won **${gw.prize}**__  ⁘`
        : `- __Nobody entered the **${gw.prize}** giveaway__  ⁘`,
      allowedMentions: { users: winnerIds },
    }).catch(() => {});
  }
  return updated;
}

async function remove(client, gw) {
  clearTimeout(timers.get(gw.messageId));
  timers.delete(gw.messageId);
  await giveaways().deleteOne({ _id: gw._id });
  const { message } = await fetchMessage(client, gw);
  if (message) await message.delete().catch(() => {});
}

async function edit(client, gw, { prize, winners, durationMs }) {
  const set = {};
  if (prize) set.prize = prize;
  if (winners) set.winners = winners;
  if (durationMs) set.endsAt = Date.now() + durationMs;
  await giveaways().updateOne({ _id: gw._id }, { $set: set });
  const updated = { ...gw, ...set };
  const { message } = await fetchMessage(client, gw);
  if (message) await message.edit(buildMessage(updated)).catch(() => {});
  arm(client, updated);
  return updated;
}

const listActive = (guildId) => giveaways().find({ guildId, ended: false }).sort({ endsAt: 1 }).toArray();

async function handleEnter(interaction) {
  const gw = await giveaways().findOne({ messageId: interaction.message.id });
  if (!gw || gw.ended) return interaction.reply({ content: '__This giveaway has ended__', flags: 64 });
  const joined = gw.entries.includes(interaction.user.id);
  await giveaways().updateOne({ _id: gw._id }, joined ? { $pull: { entries: interaction.user.id } } : { $addToSet: { entries: interaction.user.id } });
  const entries = joined ? gw.entries.filter((id) => id !== interaction.user.id) : [...gw.entries, interaction.user.id];
  await interaction.update(buildMessage({ ...gw, entries })).catch(() => {});
  return interaction.followUp({ content: joined ? '__You left the giveaway__' : '__You entered the giveaway__', flags: 64 }).catch(() => {});
}

function register(client) {
  client.once(Events.ClientReady, async () => {
    const active = await giveaways().find({ ended: false }).toArray().catch(() => []);
    for (const gw of active) arm(client, gw);
  });
  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isButton() && interaction.customId === ENTER_ID) {
      handleEnter(interaction).catch((error) => console.error('Giveaway entry failed:', error));
    }
  });
}

module.exports = { register, create, end, reroll, remove, edit, find, listActive, parseDuration };
