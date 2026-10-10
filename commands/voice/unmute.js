const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget, isMuter } = require('../../utils/access/permissions');
const { getGuildConfig } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');

const COOLDOWN_MS = 15000;

module.exports = {
  name: 'unmute',
  aliases: [],
  description: 'Unmute a member in voice',
  usage: '<ID|@member|username>',
  category: 'Voice Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Unmute a member in voice',
        usage: '&unmute <ID|@member|username>',
        notes: ['Cooldown: 15 seconds'],
      });
    }
    const config = await getGuildConfig(message.guild.id);
    if (!isMuter(message.member, config)) {
      return notice(message, "__You don't have permission__");
    }

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");

    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    if (!member.voice.channelId) return notice(message, "__That user isn't in a voice channel__");

    const cd = hit(`unmute:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    await member.voice.setMute(false, `Unmuted by ${message.author.username}`);
    await card(message, { title: 'Command', lines: [`__Unmuted__ **${member.user.username}** __in voice__`] });
  },
};
