'use strict';
const { notice, divider, textBlock } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { listProfiles } = require('../../models/economy/profiles');
const { comma } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');
const { buildPage, sendPaged } = require('../../utils/render/clanBoard');

const PREV = 'prlist_prev';
const NEXT = 'prlist_next';

function profileSection(profile) {
  const lines = [
    `**${profile.profileId}**`,
    `> -# **Name :** ${profile.name ? `\`${profile.name}\`` : '__Not in shop__'}`,
    `> -# **Price :** ${profile.price != null ? `\`${comma(profile.price)}\` ${EMOJI.coin}` : '`-`'}`,
    `> -# **Stock :** ${profile.stock == null ? '`-`' : profile.stock === -1 ? '__Unlimited__' : `\`${profile.stock}\``}`,
  ];
  return {
    type: 9,
    components: [textBlock(lines.join('\n'))],
    accessory: { type: 11, media: { url: profile.imageUrl }, description: `Profile ${profile.profileId}`, spoiler: false },
  };
}

module.exports = {
  name: 'prlist',
  aliases: [],
  description: 'List every profile background',
  usage: '',
  category: 'Owner Commands',
  async execute(message) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');
    if (!(await listProfiles()).length) return notice(message, '__No profile backgrounds created yet - use__ `&prcreate`');

    const head = [textBlock(`## ${EMOJI.box} Profile Backgrounds`), divider()];
    await sendPaged(message, {
      load: () => listProfiles(),
      render: (list, page) => buildPage({ head, ranked: list, page, prevId: PREV, nextId: NEXT, section: profileSection }),
      prevId: PREV,
      nextId: NEXT,
    });
  },
};
