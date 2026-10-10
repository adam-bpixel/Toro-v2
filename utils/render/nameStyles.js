'use strict';
const { ACCENT_COLOR, COMPONENTS_V2, textBlock, divider } = require('./embeds');
const { NAME_STYLE_EMOJI, EMOJI } = require('../emojis');
const { previewUrl } = require('./nameStyleImages');


const FONTS = [
  { id: 1, key: 'bangers', label: 'Bold Comic', feel: 'thick comic-book lettering', preview: 'font-1-bangers.png' },
  { id: 2, key: 'biorhyme', label: 'Elegant Serif', feel: 'classic, refined serif', preview: 'font-2-biorhyme.png' },
  { id: 3, key: 'cherrybomb', label: 'Sakura', feel: 'playful bubble characters', preview: 'font-3-cherrybomb.png' },
  { id: 4, key: 'chicle', label: 'Jellybean', feel: 'rounded, soft and bubbly', preview: 'font-4-chicle.png' },
  { id: 5, key: 'compagnon', label: 'Display', feel: 'stylish mixed-weight display', preview: 'font-5-compagnon.png' },
  { id: 6, key: 'museomoderno', label: 'Modern', feel: 'clean, geometric', preview: 'font-6-museomoderno.png' },
  { id: 7, key: 'neocastel', label: 'Medieval', feel: 'gothic medieval lettering', preview: 'font-7-neocastel.png' },
  { id: 8, key: 'pixelify', label: '8Bit', feel: 'retro pixel characters', preview: 'font-8-pixelifysans.png' },
  { id: 9, key: 'ribes', label: 'Decorative', feel: 'expressive display', preview: 'font-9-ribes.png' },
  { id: 10, key: 'sinistre', label: 'Vampyre', feel: 'dark, jagged, gothic', preview: 'font-10-sinistre.png' },
  { id: 11, key: 'default', label: 'Default', feel: "Discord's standard font", preview: 'font-11-ggsans.png' },
  { id: 12, key: 'zillaslab', label: 'Tempo', feel: 'modern slab-serif', preview: 'font-12-zillaslab.png' },
];

const EFFECTS = [
  { id: 1, key: 'solid', feel: 'a flat single color', colors: '1 color', preview: 'effect-1-solid.png' },
  { id: 2, key: 'gradient', feel: 'a blend from the first color to the second', colors: '2 colors (required)', preview: 'effect-2-gradient.png' },
  { id: 3, key: 'neon', feel: 'a glowing outline around the letters', colors: '1 color', preview: 'effect-3-neon.png' },
  { id: 4, key: 'toon', feel: 'a soft gradient fill with a stroke outline', colors: '1 color', preview: 'effect-4-toon.png' },
  { id: 5, key: 'pop', feel: 'a colored drop shadow behind the letters', colors: '1 color', preview: 'effect-5-pop.png' },
  { id: 6, key: 'glow', feel: 'a soft outer glow', colors: '1 color, a 2nd is the accent', preview: 'effect-6-glow.png' },
];

const FONT_IDS = Object.fromEntries(FONTS.map((f) => [f.key, f.id]));
const EFFECT_IDS = Object.fromEntries(EFFECTS.map((e) => [e.key, e.id]));

const MENU_ID = 'nsh_menu';
const emoji = (e) => ({ id: e.id, name: e.name });

const point = '<:point:1551750386967122050>';
const bullets = (lines) => lines.map((l) => `${point} ${l}`).join('\n');

const HELP_BANNER = 'help-banner.png';
const HELP_BANNER_LINK = "https://cdn.discordapp.com/attachments/1553531361329938523/1553559324612100268/tumblr_555cb1f8bba3c7feadff97b0c08bf1e7_ea7f77e2_1280.png?ex=6ab9b05e&is=6ab85ede&hm=68664010082e18d2fa877e0fc94aa1b0946006f4fea668e9a41fcadd9cda8641&";
const bulletless = (lines) => lines.join('\n');

function summaryPage(urls) {
  return [
    textBlock(`## ${NAME_STYLE_EMOJI.title.text} Name Styles`),
    divider(),
    textBlock("- __Change the color, font and effect of the bot's name in this server__  ⁘"),
    divider(),
    textBlock(bulletless(['**Usage**', '`&gp style <color> [color2] [font] [effect]`', '`&gp style reset`'])),
    divider(),
    textBlock(bulletless([
      '**Examples**',
      '`&gp style ff00ff` : a pink name',
      '`&gp style ff00ff 800080` : a pink to purple gradient',
      '`&gp style ffffff 10 3` : white, Vampyre font, neon effect',
    ])),
    divider(),
    { type: 12, items: [{ media: { url: urls[HELP_BANNER] || HELP_BANNER_LINK }, description: 'Banner' }] },
  ];
}

const FONT_START = 1;
const EFFECT_START = FONT_START + FONTS.length;
const TOTAL = EFFECT_START + EFFECTS.length;

const imageUrl = (file, urls) => urls[file] || `attachment://${file}`;

function fontPage(font, urls) {
  const parts = [
    textBlock(`## ${NAME_STYLE_EMOJI.font.text} ${font.label}`),
    divider(),
    textBlock(bullets([
      `__Number__ : \`${font.id}\``,
      `__Word__ : \`${font.key}\``,
      `__Look__ : ${font.feel}`,
    ])),
  ];
  if (font.preview) parts.push(divider(), { type: 12, items: [{ media: { url: imageUrl(font.preview, urls) }, description: font.label }] }, divider());
  else parts.push(divider(), textBlock(`-# ${point} No preview image for this font.`), divider());
  return parts;
}

function effectPage(effect, urls) {
  const name = `${effect.key[0].toUpperCase()}${effect.key.slice(1)}`;
  return [
    textBlock(`## ${NAME_STYLE_EMOJI.effects.text} ${name}`),
    divider(),
    textBlock(bullets([
      `__Number__ : \`${effect.id}\``,
      `__Word__ : \`${effect.key}\``,
      `__Look__ : ${effect.feel}`,
      `__Colors__ : ${effect.colors}`,
    ])),
    divider(),
    { type: 12, items: [{ media: { url: imageUrl(effect.preview, urls) }, description: name }] },
    divider(),
  ];
}

function pageParts(index, urls) {
  if (index < FONT_START) return summaryPage(urls);
  if (index < EFFECT_START) return fontPage(FONTS[index - FONT_START], urls);
  return effectPage(EFFECTS[index - EFFECT_START], urls);
}

const sectionOf = (index) => (index < FONT_START ? 'summary' : index < EFFECT_START ? 'fonts' : 'effects');
const START_OF = { summary: 0, fonts: FONT_START, effects: EFFECT_START };
const rangeOf = (index) => (index < EFFECT_START ? [FONT_START, EFFECT_START - 1] : [EFFECT_START, TOTAL - 1]);

function menuRow(userId, index) {
  const current = sectionOf(index);
  const option = (value, label, description, e) => ({ label, value, description, emoji: emoji(e), default: value === current });
  return {
    type: 1,
    components: [{
      type: 3,
      custom_id: `${MENU_ID}:${userId}`,
      placeholder: 'Select a page',
      min_values: 1,
      max_values: 1,
      options: [
        option('fonts', 'Fonts', 'All 12 fonts, one per page', NAME_STYLE_EMOJI.font),
        option('effects', 'Effects', 'All 6 effects, one per page', NAME_STYLE_EMOJI.effects),
        option('summary', 'Back to summary', 'How to use the style command', NAME_STYLE_EMOJI.title),
      ],
    }],
  };
}

const arrow = (text) => {
  const [, name, id] = text.match(/<a?:(\w+):(\d+)>/);
  return { id, name, animated: true };
};

function buttonsRow(userId, index) {
  return {
    type: 1,
    components: [
      { type: 2, custom_id: `nsh_prev:${userId}`, style: 2, emoji: arrow(EMOJI.left), disabled: index <= rangeOf(index)[0] },
      { type: 2, custom_id: `nsh_next:${userId}`, style: 2, emoji: arrow(EMOJI.right), disabled: index >= rangeOf(index)[1] },
    ],
  };
}

const previewOf = (index) => (index < FONT_START ? HELP_BANNER : index >= EFFECT_START ? EFFECTS[index - EFFECT_START].preview : index >= FONT_START ? FONTS[index - FONT_START].preview : null);

const filesOf = () => [];

function helpPayload(userId, index = 0, { locked = false, urls = {} } = {}) {
  const rows = locked ? [] : index === 0 ? [divider(), menuRow(userId, index)] : [divider(), menuRow(userId, index), divider(), buttonsRow(userId, index)];
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [...pageParts(index, urls), ...(index === 0 ? [] : [textBlock(`-# Page ${index - rangeOf(index)[0] + 1} / ${rangeOf(index)[1] - rangeOf(index)[0] + 1}`)]), ...rows],
      spoiler: false,
    }],
  };
}

async function sendHelp(message) {
  const activeComponents = require('../runtime/activeComponents');
  let index = 0;
  let urls = { [HELP_BANNER]: await previewUrl(HELP_BANNER) };
  const sent = await message.reply({ ...helpPayload(message.author.id, index, { urls }), allowedMentions: { repliedUser: false } });
  activeComponents.claim(sent.id);
  const collector = sent.createMessageComponentCollector({ time: 5 * 60 * 1000 });
  collector.on('collect', async (interaction) => {
    try {
      if (interaction.user.id !== message.author.id) {
        return await interaction.reply({ content: 'Only the person who opened this can use it.', ephemeral: true });
      }
      if (interaction.isStringSelectMenu()) index = START_OF[interaction.values[0]] ?? 0;
      else if (interaction.customId.startsWith('nsh_prev')) index = Math.max(rangeOf(index)[0], index - 1);
      else if (interaction.customId.startsWith('nsh_next')) index = Math.min(rangeOf(index)[1], index + 1);
      await interaction.deferUpdate();
      const file = previewOf(index);
      if (file) urls = { ...urls, [file]: await previewUrl(file) };
      await interaction.editReply({ ...helpPayload(message.author.id, index, { urls }), files: filesOf(index, urls), attachments: [] });
    } catch (error) {
      console.error('Name style help failed:', error);
    }
  });
  collector.on('end', () => {
    activeComponents.release(sent.id);
    sent.edit(helpPayload(message.author.id, index, { locked: true, urls })).catch(() => {});
  });
}

module.exports = { FONTS, EFFECTS, FONT_IDS, EFFECT_IDS, sendHelp, helpPayload };
