const { resolveUser } = require('../../utils/access/resolve');
const { checkTarget, isJailer } = require('../../utils/access/permissions');
const { getGuildConfig, logJailAction } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { hit } = require('../../utils/runtime/cooldown');
const { render, mention } = require('../../handlers/security/logs');

const COOLDOWN_MS = 30000;

module.exports = {
  name: 'unjail',
  aliases: [],
  description: 'Remove jail from a member',
  usage: '<ID|@member|username> [reason]',
  category: 'Jail System',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Remove jail from a member',
        usage: '&unjail <ID|@member|username> [reason]',
        notes: ['Cooldown: 30 seconds'],
      });
    }

    const config = await getGuildConfig(message.guild.id);
    if (!isJailer(message.member, config)) return notice(message, "__You don't have permission__");

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");

    const jailRole = config.jailRoleId ? message.guild.roles.cache.get(config.jailRoleId) : null;
    if (!jailRole || !member.roles.cache.has(jailRole.id)) {
      return notice(message, '__User is not jailed__');
    }

    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return notice(message, `__${targetCheck.reason}__`);

    const cd = hit(`unjail:${message.author.id}`, COOLDOWN_MS);
    if (cd.onCooldown) return notice(message, `__Slow down, try again in ${Math.ceil(cd.remainingMs / 1000)}s__`);

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await member.roles.remove(jailRole, reason);
    await logJailAction(message.guild.id, member.id, 'unjail', reason, message.author.id);
    const logChannel = config.jailLogChannelId && message.guild.channels.cache.get(config.jailLogChannelId);
    if (logChannel?.isTextBased()) {
      logChannel.send(render({
        title: 'Member Unjailed', kind: 'create', reason,
        actorLabel: 'Unjailed by', actor: mention(message.author.id),
        fields: [['Member', mention(member.id)], ['Server', message.guild.name], ['Jail role', jailRole]],
      }, 'member_unjailed')).catch(() => {});
    }

    await card(message, {
      title: 'Command',
      lines: [`__Unjailed__ **${member.user.username}**`, `__Reason__ : ${reason}`],
    });
  },
};
