const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'set-voiceclans',
  aliases: [],
  description: 'Set clan voice category',
  usage: '<category ID|name>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'Set the category where the voice channel of each new clan is created',
        usage: '&set-voiceclans <category ID|name>',
        notes: ['Requires the Manage Server permission', 'Only clans created after this get a voice channel - use `&edit-voiceclan` for the others'],
      });
    }
    const category = clans.resolveChannel(message, args.join(' '), [ChannelType.GuildCategory]);
    if (!category) return notice(message, "__Couldn't find that category__");

    await clans.setChannelCategory(message.guild.id, 'voice', category.id);
    return card(message, { title: 'Clan Setup', lines: [`__Clan voice channels will be created in__ **${category.name}**`] });
  },
};
