'use strict';
const { AttachmentBuilder } = require('discord.js');
const { payloadOf, notice, usageCard } = require('../../utils/render/embeds');
const { localize } = require('../../utils/localize');
const { isOwner } = require('../../models/economy/premium');
const { createProfile, setPreviewUrl } = require('../../models/economy/profiles');
const { rehostImage, hostBuffer } = require('../../services/imageHost');
const { renderProfileCard } = require('../../utils/render/cards');
const { EMOJI } = require('../../utils/emojis');

const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function randomCardData() {
  return {
    avatarDecorationURL: null,
    guildIconURL: null,
    serverTag: null,
    displayName: 'Username',
    username: 'username',
    level: randomBetween(1, 150),
    levelXp: randomBetween(0, 4000),
    xpNeeded: randomBetween(4000, 8000),
    rank: randomBetween(1, 999),
    totalXp: randomBetween(500, 500000),
    commandCount: randomBetween(10, 5000),
    voiceMs: randomBetween(0, 20 * 60 * 60 * 1000),
    balance: randomBetween(0, 250000),
    avatarShape: 'circle',
  };
}

module.exports = {
  name: 'prcreate',
  aliases: [],
  description: 'Create a new profile background from an attached image',
  usage: '[image attachment]',
  category: 'Owner Commands',
  async execute(message) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const attachment = message.attachments.first();
    if (!attachment) {
      return usageCard(message, {
        summary: 'Create a new profile background - its ID starts at 1 for the first one',
        usage: '&prcreate [attach an image]',
        notes: ['Attach the background image to the message'],
      });
    }
    if (!attachment.contentType?.startsWith('image/')) return notice(message, '__Please attach an image__');

    let imageUrl;
    try {
      imageUrl = await rehostImage(attachment);
    } catch (error) {
      console.error('Profile image rehost failed:', error);
      return notice(message, "__Couldn't upload that image - please try again__");
    }

    const profile = await createProfile(imageUrl);

    const preview = await renderProfileCard({
      ...randomCardData(),
      avatarURL: message.client.user.displayAvatarURL({ extension: 'png', size: 256 }),
      backgroundURL: imageUrl,
    });
    const fileName = `profile-${profile.profileId}-preview.webp`;

    try {
      const previewUrl = await hostBuffer(preview, fileName);
      await setPreviewUrl(profile.profileId, previewUrl);
    } catch (error) {
      console.error('Profile preview hosting failed:', error);
    }

    return message.reply(await localize(message, {
      ...payloadOf({
        title: `${EMOJI.box} Profile Created`,
        lines: [
          `__ID__ : \`${profile.profileId}\``,
          '__Use__ `&prshop add` __to put it in the shop, or__ `&prgive` __to hand it out directly__',
        ],
        extraRows: [{ type: 12, items: [{ media: { url: `attachment://${fileName}` }, description: `Profile #${profile.profileId} preview`, spoiler: false }] }],
      }),
      files: [new AttachmentBuilder(preview, { name: fileName })],
      allowedMentions: { repliedUser: true },
    }));
  },
};
