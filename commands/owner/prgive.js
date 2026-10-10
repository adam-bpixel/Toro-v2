'use strict';
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { resolveUser } = require('../../utils/access/resolve');
const { getProfile, ownsProfile, giveProfile } = require('../../models/economy/profiles');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'prgive',
  aliases: [],
  description: 'Give a profile background to a member',
  usage: '<user> <profile id>',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    const profileId = Number(args[1]);
    if (!target || !Number.isInteger(profileId)) {
      return usageCard(message, { summary: 'Give a profile background to a member', usage: '&prgive <user> <profile id>' });
    }

    const profile = await getProfile(profileId);
    if (!profile) return notice(message, '__No profile background with that ID__');
    if (await ownsProfile(target.id, profileId)) return notice(message, `__${target} already owns that profile__`);

    await giveProfile(target.id, profileId);
    return card(message, {
      title: `${EMOJI.box} Profile Given`,
      lines: [`__Gave__ **#${profileId}**${profile.name ? ` (${profile.name})` : ''} __to__ ${target}`],
    });
  },
};
