'use strict';
const { PermissionFlagsBits, ComponentType } = require('discord.js');
const { getSniped } = require('../../models/enforcement/modTools');
const { container, divider, notice, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const activeComponents = require('../../utils/runtime/activeComponents');

const PREV = 'snipe_prev';
const NEXT = 'snipe_next';
const IDLE_MS = 5 * 60 * 1000;
const EPHEMERAL = 1 << 6;

function render(list, page) {
  const found = list[page];
  const lines = [`- __Author__ : <@${found.authorId}> \`${found.authorName}\``, `- __Message__ : ${found.content || '*No text*'}`];
  if (found.files.length) lines.push(`- __Attachments__ : ${found.files.join('\n')}`);
  lines.push(`- __Deleted__ : <t:${Math.floor(found.at / 1000)}:R>`);

  const parts = [
    { type: 10, content: '## Sniped Message' },
    divider(),
    { type: 10, content: lines.map((line) => `${line}  ⁘`).join('\n') },
    divider(),
    {
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: PREV, emoji: parseEmoji(EMOJI.left), disabled: page === 0 },
        { type: 2, style: 2, custom_id: NEXT, emoji: parseEmoji(EMOJI.right), disabled: page >= list.length - 1 },
      ],
    },
  ];
  return {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }],
    allowedMentions: { parse: [] },
  };
}

module.exports = {
  name: 'snipe',
  aliases: [],
  description: 'Show recently deleted messages in this channel',
  usage: '',
  category: 'Moderation Commands',
  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return notice(message, "__You don't have permission__");
    }

    const list = getSniped(message.channelId);
    if (!list.length) return notice(message, '__There is nothing to snipe__');

    let page = 0;
    const sent = await message.reply({ ...render(list, page), allowedMentions: { parse: [], repliedUser: false } });

    activeComponents.claim(sent.id);
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, idle: IDLE_MS });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction
          .reply({ flags: EPHEMERAL | COMPONENTS_V2, components: [container({ title: 'Notice', lines: ['__Only the person who ran this command can use these buttons__'] })] })
          .catch(() => {});
      }
      const fresh = getSniped(message.channelId);
      if (!fresh.length) {
        await interaction.update({ flags: COMPONENTS_V2, components: [container({ title: 'Notice', lines: ['__There is nothing left to snipe__'] })] });
        return collector.stop();
      }
      page = Math.min(Math.max(page + (interaction.customId === NEXT ? 1 : -1), 0), fresh.length - 1);
      await interaction.update(render(fresh, page));
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      await disablePanelMessage(message.guild, sent.channelId, sent.id);
    });
  },
};
