'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, nextTicketNumber } = require('../../models/core/moderation');
const { payloadOf, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { EMOJI, TICKET_LOG_EMOJI: LOG_EMOJI } = require('../../utils/emojis');
const { withCustom, buildTicketOpenPanel } = require('./ticketUI');
const { localize } = require('../../utils/localize');
const { peek, start } = require('../../utils/runtime/cooldown');
const { duration } = require('../../utils/format');

const EPHEMERAL = 1 << 6;
const TICKET_COOLDOWN_MS = 30 * 60 * 1000;
const OPEN_COLOR = 0xa8e6b0;
const CLOSE_COLOR = 0xf07178;
const NO_PINGS = { parse: [] };

const openingTickets = new Set();

const topicPrefix = (userId, categoryId) => `ticket:${userId}:${categoryId}`;
function parseTopic(topic) {
  const match = typeof topic === 'string' && topic.match(/^ticket:(\d+):([a-z]+):(\d+)$/);
  return match ? { userId: match[1], categoryId: match[2], number: match[3] } : null;
}

async function reply(interaction, title, lines, { ephemeral = true } = {}) {
  return interaction.reply(await localize(interaction, {
    ...payloadOf({ title, lines: Array.isArray(lines) ? lines : [lines] }),
    flags: ephemeral ? COMPONENTS_V2 | EPHEMERAL : COMPONENTS_V2,
  }));
}

async function openTicket(interaction, categoryId) {
  const config = await getGuildConfig(interaction.guild.id);
  const category = withCustom(config.customTicketCategories).find((c) => c.id === categoryId);
  if (!category) return reply(interaction, 'Notice', '__Unknown ticket category__');

  const parent = config.ticketCategoryId ? interaction.guild.channels.cache.get(config.ticketCategoryId) : null;
  if (!parent || parent.type !== ChannelType.GuildCategory) {
    return reply(interaction, 'Notice', '__Ticket category is not configured or missing__');
  }

  const user = interaction.user;
  const lockKey = `${interaction.guild.id}:${user.id}`;
  if (openingTickets.has(lockKey)) return reply(interaction, 'Notice', '__Please wait, your ticket is opening__');

  const cd = peek(`ticket:${interaction.guild.id}:${user.id}`, TICKET_COOLDOWN_MS);
  if (cd.onCooldown) {
    return reply(interaction, 'Notice', `__Please wait ${duration(cd.remainingMs)} before opening another ticket__`);
  }

  const existing = interaction.guild.channels.cache.find(
    (c) => c.parentId === parent.id && c.topic && c.topic.startsWith(topicPrefix(user.id, category.id)),
  );
  if (existing) return reply(interaction, 'Notice', `__You already have an open ticket in__ ${existing}`);

  openingTickets.add(lockKey);
  try {
    const number = await nextTicketNumber(interaction.guild.id);
    const channel = await interaction.guild.channels.create({
      name: `ticket-${number}`,
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: `ticket:${user.id}:${category.id}:${number}`,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: interaction.guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
      ],
      reason: `Ticket #${number} opened by ${user.username}`,
    });

    start(`ticket:${interaction.guild.id}:${user.id}`);
    await channel.send({ ...buildTicketOpenPanel({ guild: interaction.guild, user, category, number }), allowedMentions: { users: [user.id] } });

    if (config.ticketLogChannelId) {
      const logChannel = interaction.guild.channels.cache.get(config.ticketLogChannelId);
      if (logChannel) {
        await logChannel.send({
          flags: COMPONENTS_V2,
          components: [{
            type: 17,
            accent_color: OPEN_COLOR,
            components: [
              { type: 10, content: `## ${LOG_EMOJI.opened} Ticket Opened` },
              { type: 14, spacing: 1, divider: true },
              { type: 10, content: `- **Ticket:** ${channel} (\`#${number}\`)\n- **User:** ${user} (\`${user.id}\`)\n- **Category:** \`${category.label || category.id}\`` },
            ],
            spoiler: false,
          }],
          allowedMentions: NO_PINGS,
        }).catch(() => {});
      }
    }

    return reply(interaction, 'Ticket Opened', `__Your ticket has been created:__ ${channel}`);
  } catch (error) {
    console.error('Opening ticket failed:', error);
    return reply(interaction, 'Notice', '__Failed to create ticket channel (check bot permissions)__');
  } finally {
    openingTickets.delete(lockKey);
  }
}

async function closeTicket(interaction) {
  const channel = interaction.channel;
  const parsed = parseTopic(channel.topic);
  if (!parsed) return reply(interaction, 'Notice', '__This channel is not a valid ticket channel__');

  const config = await getGuildConfig(interaction.guild.id);
  const user = await interaction.client.users.fetch(parsed.userId).catch(() => null);

  await reply(interaction, 'Notice', '__Ticket will be closed in 5 seconds...__');

  if (config.ticketLogChannelId) {
    const logChannel = interaction.guild.channels.cache.get(config.ticketLogChannelId);
    if (logChannel) {
      await logChannel.send({
        flags: COMPONENTS_V2,
        components: [{
          type: 17,
          accent_color: CLOSE_COLOR,
          components: [
            { type: 10, content: `## ${LOG_EMOJI.closed} Ticket Closed` },
            { type: 14, spacing: 1, divider: true },
            {
              type: 10,
              content: `- **Ticket:** \`#${parsed.number}\` (\`${channel.name}\`)\n- **Opened By:** ${user ? `${user} (\`${user.id}\`)` : `\`${parsed.userId}\``}\n- **Closed By:** ${interaction.user} (\`${interaction.user.id}\`)\n- **Category:** \`${parsed.categoryId}\``,
            },
          ],
          spoiler: false,
        }],
        allowedMentions: NO_PINGS,
      }).catch(() => {});
    }
  }

  setTimeout(() => channel.delete('Ticket closed by user').catch(() => {}), 5000);
}

async function handleTicketInteraction(interaction) {
  if (interaction.customId === 'close_ticket') return closeTicket(interaction);
  if (interaction.customId === 'ticket_select' && interaction.isStringSelectMenu()) {
    return openTicket(interaction, interaction.values[0]);
  }
  if (interaction.customId.startsWith('ticket_')) {
    const categoryId = interaction.customId.slice('ticket_'.length);
    return openTicket(interaction, categoryId);
  }
}

module.exports = {
  OPEN_COLOR,
  CLOSE_COLOR,
  openTicket,
  closeTicket,
  handleTicketInteraction,
  parseTopic,
};
