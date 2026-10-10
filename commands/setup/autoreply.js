const { PermissionFlagsBits } = require('discord.js');
const autoreply = require('../../models/settings/autoreply');
const { buildPanel } = require('../../handlers/setup/autoreplySetup');
const { notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'autoreply',
  aliases: [],
  description: 'Configure auto replies',
  usage: '',
  category: 'Setup Commands',
  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return notice(message, "__You don't have permission__");
    await message.reply({ ...buildPanel(message.guild, await autoreply.list(message.guild.id)), allowedMentions: { repliedUser: false } });
  },
};
