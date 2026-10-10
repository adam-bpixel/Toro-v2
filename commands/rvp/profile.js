const { AttachmentBuilder } = require('discord.js');
const { getUser, levelFromTotalXp, getRank, setAvatarShape, getActiveCard } = require('../../models/economy/economy');
const { getProfile } = require('../../models/economy/profiles');
const { card: reply } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');
const { renderProfileCard } = require('../../utils/render/cards');

module.exports = {
  name: 'profile',
  aliases: ['p', 'prof'],
  description: 'View your profile card',
  usage: '[@member] | square | circle',
  category: 'Rvp System',
  async execute(message, args) {
    const shape = (args[0] || '').toLowerCase();
    if (shape === 'square' || shape === 'circle') {
      await setAvatarShape(message.author.id, shape);
      return reply(message, {
        title: 'Profile',
        lines: [`${EMOJI.success} __Avatar shape set to **${shape}**__`, shape === 'circle' ? '__Round avatar, with decoration support__' : '__Square avatar with soft rounded corners__'],
        ping: false,
      });
    }

    const target = message.mentions.users.first() || message.author;
    const user = await getUser(target.id);
    const { level, levelXp, xpNeeded } = levelFromTotalXp(user.totalXp);
    const rank = await getRank(target.id);
    const equipped = user.equippedProfileId ? await getProfile(user.equippedProfileId) : null;
    const activeCard = await getActiveCard(target.id);

    const card = await renderProfileCard({
      avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
      avatarDecorationURL: target.avatarDecorationURL({ size: 256 }),
      guildIconURL: message.guild ? message.guild.iconURL({ extension: 'png', size: 128 }) : null,
      serverTag: target.primaryGuild?.identityEnabled && target.primaryGuild.tag
        ? { tag: target.primaryGuild.tag, badgeURL: target.guildTagBadgeURL({ size: 64 }) }
        : null,
      displayName: target.displayName || target.username,
      username: target.username,
      level,
      levelXp,
      xpNeeded,
      rank,
      totalXp: user.totalXp,
      commandCount: user.commandCount,
      voiceMs: user.voiceMs,
      balance: user.balance,
      avatarShape: user.avatarShape,
      backgroundURL: equipped?.imageUrl,
      cardBoostMultiplier: activeCard?.multiplier,
    });

    await message.reply({
      files: [new AttachmentBuilder(card, { name: 'profile.webp' })],
      allowedMentions: { repliedUser: false },
    });
  },
};
