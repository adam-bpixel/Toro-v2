'use strict';
const { ComponentType } = require('discord.js');
const { container, divider, ACCENT_COLOR, COMPONENTS_V2 } = require('./embeds');
const { EMOJI } = require('../emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');
const { disablePanelMessage } = require('../runtime/panels');
const activeComponents = require('../runtime/activeComponents');

const PER_PAGE = 5;
const IDLE_MS = 5 * 60 * 1000;

const clanIcon = (guild, botIcon, clan) => clan.avatarUrl || guild.roles.cache.get(clan.roleId)?.iconURL({ size: 256 }) || botIcon;

function buildPage({ head, section, ranked, page, prevId, nextId, perPage = PER_PAGE }) {
  const pages = Math.ceil(ranked.length / perPage);
  const start = page * perPage;
  const parts = [...head];
  ranked.slice(start, start + perPage).forEach((clan, i) => parts.push(section(clan, start + i + 1), divider()));
  parts.push({
    type: 1,
    components: [
      { type: 2, style: 2, custom_id: prevId, emoji: parseEmoji(EMOJI.left), disabled: page === 0 },
      { type: 2, style: 2, custom_id: nextId, emoji: parseEmoji(EMOJI.right), disabled: page >= pages - 1 },
    ],
  });
  return {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }],
    allowedMentions: { parse: [] },
  };
}

async function sendPaged(message, { load, render, prevId, nextId, perPage = PER_PAGE }) {
  let page = 0;
  const sent = await message.reply({ ...render(await load(), page), allowedMentions: { parse: [], repliedUser: false } });

  activeComponents.claim(sent.id);
  const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, idle: IDLE_MS });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      return interaction
        .reply({ flags: (1 << 6) | COMPONENTS_V2, components: [container({ title: 'Notice', lines: ['__Only the person who ran this command can use these buttons__'] })] })
        .catch(() => {});
    }
    const fresh = await load();
    const pages = Math.max(1, Math.ceil(fresh.length / perPage));
    page = Math.min(Math.max(page + (interaction.customId === nextId ? 1 : -1), 0), pages - 1);
    await interaction.update(render(fresh, page));
  });

  collector.on('end', async () => {
    activeComponents.release(sent.id);
    await disablePanelMessage(message.guild, sent.channelId, sent.id);
  });
}

module.exports = { PER_PAGE, clanIcon, buildPage, sendPaged };
