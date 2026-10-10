'use strict';
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { resolveUser } = require('../../utils/access/resolve');
const { getProfile, removeProfile } = require('../../models/economy/profiles');
const { EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'prremove',
  aliases: [],
  description: 'Remove a profile background from a member',
  usage: '<user> <profile id>',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    const profileId = Number(args[1]);
    if (!target || !Number.isInteger(profileId)) {
      return usageCard(message, { summary: 'Remove a profile background from a member', usage: '&prremove <user> <profile id>' });
    }

    const profile = await getProfile(profileId);
    if (!(await removeProfile(target.id, profileId))) return notice(message, `__${target} doesn't own that profile__`);
    return card(message, {
      title: `${EMOJI.box} Profile Removed`,
      lines: [`__Removed__ **#${profileId}**${profile?.name ? ` (${profile.name})` : ''} __from__ ${target}`],
    });
  },
};
