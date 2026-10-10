const { PermissionFlagsBits } = require('discord.js');
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider, bullet, card, notice } = require('../../utils/render/embeds');
const { localize } = require('../../utils/localize');
const { prefixesFor } = require('../../models/settings/prefix');
const { themeOf, saveTheme, parseColor, toHex } = require('../../models/settings/theme');

const HEADER_EMOJI = '<:prmActivated:1552285203777454231>';

function themePanel(prefix, color) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${HEADER_EMOJI} Server Theme`),
        divider(),
        textBlock(bullet(`__**Current Color :** ${toHex(color)}__`)),
        divider(),
        textBlock(`**:: Usage ::**\n\n\`${prefix}theme <color>\`\n\`${prefix}theme reset\`\n\n**:: Formats ::**\n\`#RRGGBB\` \`RRGGBB\` \`0xRRGGBB\` \`decimal\``),
      ],
      spoiler: false,
    }],
  };
}

module.exports = {
  name: 'theme',
  aliases: [],
  description: 'Set the accent colour of the bot in this server',
  usage: '[color|reset]',
  category: 'Premium Commands',
  async execute(message, args) {
    if (!message.guild) return notice(message, '__This command can only be used in a server__');

    const current = themeOf(message.guild.id);
    if (!args.length) {
      const { server } = await prefixesFor(message.guild.id, message.author.id);
      return message.reply(await localize(message, { ...themePanel(server, current ?? ACCENT_COLOR), allowedMentions: { repliedUser: true } }));
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return notice(message, "__You don't have permission__");
    }

    if (args.length === 1 && args[0].toLowerCase() === 'reset') {
      if (current === null) return notice(message, '__The server has no theme to reset__');
      await saveTheme(message.guild.id, null);
      return card(message, { title: 'Server Theme', lines: [`__Theme reset to the default color__`] });
    }

    const color = args.length === 1 ? parseColor(args[0]) : null;
    if (color === null) return notice(message, '__Invalid color. Use #RRGGBB, RRGGBB, 0xRRGGBB or a decimal number__');
    if (color === current) return notice(message, `__The theme is already ${toHex(color)}__`);

    await saveTheme(message.guild.id, color);
    await card(message, { title: 'Server Theme', lines: [`__Theme color changed to__ ${toHex(color)}`] });
  },
};
