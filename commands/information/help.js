'use strict';
const { COMPONENTS_V2, ACCENT_COLOR, container, textBlock, divider } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const activeComponents = require('../../utils/runtime/activeComponents');
const { prefixOf } = require('../../utils/localize');

const PAGE_SIZE = 5;
const IDLE_MS = 2 * 60 * 1000;
const CATEGORY_SELECT_ID = 'help_category';
const PREV_ID = 'help_prev';
const NEXT_ID = 'help_next';
const SLASH_CATEGORY = 'Slash Commands';
const BANNER_URL = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553559324612100268/tumblr_555cb1f8bba3c7feadff97b0c08bf1e7_ea7f77e2_1280.png?ex=6ab9b05e&is=6ab85ede&hm=68664010082e18d2fa877e0fc94aa1b0946006f4fea668e9a41fcadd9cda8641&';

const CATEGORY_META = {
  'Information Commands': { label: 'Information Commands', description: 'Information commands' },
  'Moderation Commands': { label: 'Moderation Commands', description: 'Moderation commands' },
  'Roles Commands': { label: 'Roles Commands', description: 'Role management commands' },
  'Premium Commands': { label: 'Premium Commands', description: 'Premium server commands' },
  'Voice Commands': { label: 'Voice Commands', description: 'Voice channel commands' },
  'Rvp System': { label: 'RVP Commands', description: 'RVP and profile commands' },
  'Clans Commands': { label: 'Clans Commands', description: 'Clan system commands' },
  'Jail System': { label: 'Jail Commands', description: 'Jail system commands' },
  'Verification System': { label: 'Verification Commands', description: 'Verification commands' },
  'Setup Commands': { label: 'Setup Commands', description: 'Server setup commands' },
  'Owner Commands': { label: 'Owner Commands', description: 'Bot owner commands' },
};
const metaOf = (name) => CATEGORY_META[name] || { label: name, description: `${name} commands` };

function activeCategories(client) {
  const present = new Set(client.commands.map((command) => command.category).filter(Boolean));
  const known = Object.keys(CATEGORY_META).filter((name) => present.has(name));
  const unknown = [...present].filter((name) => !CATEGORY_META[name]).sort();
  const categories = [...known, ...unknown];
  if (client.slashCommands.size) categories.push(SLASH_CATEGORY);
  return categories;
}

function commandsOf(client, category) {
  const rows = category === SLASH_CATEGORY
    ? [...client.slashCommands.values()].map((d) => ({ name: d.name, description: d.data && d.data.description }))
    : [...client.commands.values()].filter((c) => c.category === category).map((c) => ({ name: c.name, description: c.description }));
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

function categorySelect(client, current) {
  const options = activeCategories(client).map((name) => {
    const meta = metaOf(name);
    return { label: meta.label, value: name, description: meta.description, default: name === current };
  });
  return { type: 1, components: [{ type: 3, custom_id: CATEGORY_SELECT_ID, placeholder: 'Select a category', min_values: 1, max_values: 1, options }] };
}

const navRow = (page, pages) => ({
  type: 1,
  components: [
    { type: 2, style: 2, custom_id: PREV_ID, emoji: parseEmoji(EMOJI.left), disabled: page <= 0 },
    { type: 2, style: 2, custom_id: NEXT_ID, emoji: parseEmoji(EMOJI.right), disabled: page >= pages - 1 },
  ],
});

function landingPayload(client, prefix) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        {
          type: 9,
          components: [textBlock(
            `**__Hello dear__** I am _${client.user.username}_, an entertaining and engaging Discord bot designed to bring laughter and excitement to communities. Packed with features!\n\n`
            + `*If you need any help, use the [${prefix}support](<https://discord.gg/zk92wu2Vh>) to get in touch with the developers*\n\n`
            + '- Use </premium:1524978012209152214> to enable Server Premium  ⁘\n- Select a category below to view commands',
          )],
          accessory: { type: 11, media: { url: client.user.displayAvatarURL({ size: 256 }) }, description: 'Bot Icon', spoiler: false },
        },
        divider(),
        textBlock(`- Use \`${prefix}setup\` to configure all bot features including Auto Role, Auto Tag, Staff Apply, Muter, RoleRequest, Ticket, Verificator, Jailer, Clan Manager, Aliases, Clear Setup, and Prefix in one interactive panel!`),
        { type: 12, items: [{ media: { url: BANNER_URL }, description: 'Banner', spoiler: false }] },
        divider(),
        categorySelect(client, null),
      ],
      spoiler: false,
    }],
  };
}

function categoryPayload(client, category, page, prefix) {
  const all = commandsOf(client, category);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const clamped = Math.min(Math.max(page, 0), pages - 1);
  const shown = all.slice(clamped * PAGE_SIZE, clamped * PAGE_SIZE + PAGE_SIZE);
  const shownPrefix = category === SLASH_CATEGORY ? '/' : prefix;
  const lines = shown.map((c) => `- \`${shownPrefix}${c.name}\`\n  ⤷ ${c.description || 'No description'}`).join('\n\n');

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${metaOf(category).label}`),
        divider(),
        textBlock(`Page ${clamped + 1} / ${pages}`),
        divider(),
        textBlock(lines || '__No commands in this category__'),
        divider(),
        categorySelect(client, category),
        divider(),
        navRow(clamped, pages),
      ],
      spoiler: false,
    }],
  };
}

const notYours = (interaction) => interaction
  .reply({ flags: COMPONENTS_V2 | (1 << 6), components: [container({ title: 'Notice', lines: ['__Only the person who ran this command can use these buttons__'] })] })
  .catch(() => {});

module.exports = {
  name: 'help',
  aliases: [],
  description: 'Show all available commands',
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    const { client } = message;
    const prefix = await prefixOf(message);
    const sent = await message.reply({ ...landingPayload(client, prefix), allowedMentions: { repliedUser: false, parse: [] } });
    activeComponents.claim(sent.id);

    let state = { category: null, page: 0 };
    const collector = sent.createMessageComponentCollector({ idle: IDLE_MS });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) return notYours(interaction);
      try {
        const interactionPrefix = await prefixOf(interaction);
        if (interaction.isStringSelectMenu() && interaction.customId === CATEGORY_SELECT_ID) {
          state = { category: interaction.values[0], page: 0 };
          return await interaction.update({ ...categoryPayload(client, state.category, state.page, interactionPrefix), allowedMentions: { parse: [] } });
        }
        if (interaction.isButton() && state.category && (interaction.customId === PREV_ID || interaction.customId === NEXT_ID)) {
          state.page += interaction.customId === NEXT_ID ? 1 : -1;
          return await interaction.update({ ...categoryPayload(client, state.category, state.page, interactionPrefix), allowedMentions: { parse: [] } });
        }
      } catch (error) {
        console.error('Help interaction failed:', error);
      }
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      if (message.guild) await disablePanelMessage(message.guild, sent.channelId, sent.id);
    });
  },
};
