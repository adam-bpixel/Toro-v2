const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget, isMuter } = require('../../utils/access/permissions');
const { getGuildConfig } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { parseDuration } = require('../../utils/format');
const { hit } = require('../../utils/runtime/cooldown');

const COOLDOWN_MS = 15000;

module.exports = {
  name: 'mute',
  aliases: [],
  description: 'Mute a member in voice',
  usage: '<ID|@member|username> [duration] [reason]',
  category: 'Voice Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Mute a member in voice',
        usage: '&mute <ID|@member|username> [duration] [reason]',
        notes: ['Duration: 5s, 10m, 1h, 2d', 'Cooldown: 15 seconds'],
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

    const cd = hit(`mute:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    let rest = args.slice(1);
    let durationLabel = null;
    let durationMs = null;
    if (rest.length && parseDuration(rest[0]) !== null) {
      durationLabel = rest[0];
      durationMs = parseDuration(rest[0]);
      rest = rest.slice(1);
    }
    const reason = rest.join(' ') || 'No reason provided';

    await member.voice.setMute(true, reason);
    if (durationMs) {
      setTimeout(() => member.voice.setMute(false, 'Mute duration expired').catch(() => {}), durationMs);
    }

    await card(message, {
      title: 'Command',
      lines: [
        `__Muted__ **${member.user.username}** __in voice__`,
        `__Reason__ : ${reason}`,
        durationLabel ? `__Duration__ : ${durationLabel}` : null,
      ].filter(Boolean),
    });
  },
};
