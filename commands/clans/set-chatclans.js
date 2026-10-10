const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'set-chatclans',
  aliases: [],
  description: 'Set clan chat category',
  usage: '<category ID|name>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return notice(message, "__You don't have permission__");
    }
    if (!args.length) {
      return usageCard(message, {
        summary: 'Set the category where the chat channel of each new clan is created',
        usage: '&set-chatclans <category ID|name>',
        notes: ['Requires the Manage Server permission', 'Only clans created after this get a chat channel - use `&edit-chatclan` for the others'],
      });
    }
    const category = clans.resolveChannel(message, args.join(' '), [ChannelType.GuildCategory]);
    if (!category) return notice(message, "__Couldn't find that category__");

    await clans.setChannelCategory(message.guild.id, 'chat', category.id);
    return card(message, { title: 'Clan Setup', lines: [`__Clan chat channels will be created in__ **${category.name}**`] });
  },
};
