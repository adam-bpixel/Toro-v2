'use strict';
const { ComponentType } = require('discord.js');
const { COMPONENTS_V2, ACCENT_COLOR, container, textBlock, divider } = require('../../utils/render/embeds');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const activeComponents = require('../../utils/runtime/activeComponents');
const { ROLES_LIST_EMOJI, TICKET_EMOJI } = require('../../utils/emojis');

const MAX_DESC = 4096;
const MAX_EMBEDS = 10;
const IDLE_MS = 5 * 60 * 1000;
const EPHEMERAL = 1 << 6;
const SHOW_ID = 'roles_show';
const ROLES_EMOJI = ROLES_LIST_EMOJI.title;

function chunkLines(lines, maxLen) {
  const chunks = [];
  let current = '';
  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > maxLen) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function buildRolesEmbeds(guild) {
  const roles = [...guild.roles.cache.values()]
    .filter((r) => r.id !== guild.id)
    .sort((a, b) => b.position - a.position);

  const lines = roles.map((r) => `<@&${r.id}> ⟿ **${r.members.size}**`);
  lines.push(`@everyone ⟿ **${guild.memberCount}**`);

  const chunks = chunkLines(lines, MAX_DESC).slice(0, MAX_EMBEDS);
  return chunks.map((description, i) => {
    const embed = { description, color: ACCENT_COLOR };
    if (i === 0) embed.title = `Roles [${guild.roles.cache.size}]`;
    if (i === chunks.length - 1) {
      embed.footer = { text: `${guild.client.user.username} | Roles`, icon_url: guild.client.user.displayAvatarURL({ size: 128 }) };
      embed.timestamp = new Date().toISOString();
    }
    return embed;
  });
}

module.exports = {
  name: 'roles',
  aliases: [],
  description: 'Display all server roles',
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    await message.guild.members.fetch().catch(() => {});

    const sent = await message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          textBlock(`## ${ROLES_EMOJI} Roles [${message.guild.roles.cache.size}]`),
          divider(),
          textBlock('- __Click the button below to view all roles in this server__  ⁘'),
          divider(),
          { type: 1, components: [{ type: 2, custom_id: `${SHOW_ID}_${message.guild.id}_${message.author.id}`, style: 2, label: 'Show Roles' }] },
          divider(),
          textBlock(`-# ${TICKET_EMOJI.footer} ༯ Requested by ${message.author.username}`),
        ],
        spoiler: false,
      }],
      allowedMentions: { repliedUser: true },
    });

    activeComponents.claim(sent.id);
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, idle: IDLE_MS });

    collector.on('collect', async (interaction) => {
      if (!interaction.customId.startsWith(SHOW_ID)) return;
      const ownerId = interaction.customId.split('_').pop();
      if (interaction.user.id !== ownerId) {
        return interaction
          .reply({ flags: COMPONENTS_V2 | EPHEMERAL, components: [container({ title: 'Notice', lines: ['__Only the person who ran this command can use this button__'] })] })
          .catch(() => {});
      }
      await interaction
        .reply({ embeds: buildRolesEmbeds(message.guild), flags: EPHEMERAL, allowedMentions: { parse: [] } })
        .catch(() => {});
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      await disablePanelMessage(message.guild, sent.channelId, sent.id);
    });
  },
};
