const { AttachmentBuilder } = require('discord.js');
const { getUser, levelFromTotalXp, getRank } = require('../../models/economy/economy');
const { renderRankCard } = require('../../utils/render/cards');

module.exports = {
  name: 'rank',
  aliases: ['level', 'lvl', 'r'],
  description: 'View your rank card',
  usage: '',
  category: 'Rvp System',
  async execute(message) {
    const target = message.mentions.users.first() || message.author;
    const user = await getUser(target.id);
    const { level, levelXp, xpNeeded } = levelFromTotalXp(user.totalXp);
    const rank = await getRank(target.id);

    const card = await renderRankCard({
      avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
      avatarDecorationURL: target.avatarDecorationURL({ size: 256 }),
      guildIconURL: message.guild ? message.guild.iconURL({ extension: 'png', size: 128 }) : null,
      displayName: target.displayName || target.username,
      level,
      levelXp,
      xpNeeded,
      rank,
      voiceMs: user.voiceMs,
      messageCount: user.messageCount,
      totalXp: user.totalXp,
    });

    await message.reply({
      files: [new AttachmentBuilder(card, { name: 'rank.webp' })],
      allowedMentions: { repliedUser: false },
    });
  },
};
