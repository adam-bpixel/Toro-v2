const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget, isJailer } = require('../../utils/access/permissions');
const { getGuildConfig, logJailAction } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');
const { render, mention } = require('../../handlers/security/logs');

const COOLDOWN_MS = 30000;

module.exports = {
  name: 'jail',
  aliases: [],
  description: 'Jail a member from the server',
  usage: '<ID|@member|username> [reason]',
  category: 'Jail System',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Jail a member from the server',
        usage: '&jail <ID|@member|username> [reason]',
        notes: ['Cooldown: 30 seconds'],
      });
    }

    const config = await getGuildConfig(message.guild.id);
    if (!isJailer(message.member, config)) return notice(message, "__You don't have permission__");
    if (!config.jailRoleId) {
      return notice(message, ['__Jail role not configured__', '__Use `&jailsetup` command first__']);
    }
    const jailRole = message.guild.roles.cache.get(config.jailRoleId);
    if (!jailRole) return notice(message, ['__Jail role not configured__', '__Use `&jailsetup` command first__']);

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");

    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);
    if (member.roles.cache.has(jailRole.id)) return notice(message, `__**${member.user.username}** is already jailed__`);

    const cd = hit(`jail:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await member.roles.add(jailRole, reason);
    await logJailAction(message.guild.id, member.id, 'jail', reason, message.author.id);
    const logChannel = config.jailLogChannelId && message.guild.channels.cache.get(config.jailLogChannelId);
    if (logChannel?.isTextBased()) {
      logChannel.send(render({
        title: 'Member Jailed', kind: 'warn', reason,
        actorLabel: 'Jailed by', actor: mention(message.author.id),
        fields: [['Member', mention(member.id)], ['Server', message.guild.name], ['Jail role', jailRole]],
      }, 'member_jailed')).catch(() => {});
    }

    await card(message, {
      title: 'Command',
      lines: [`__Jailed__ **${member.user.username}**`, `__Reason__ : ${reason}`],
    });
  },
};
