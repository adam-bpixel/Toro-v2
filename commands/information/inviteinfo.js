const { card, notice, usageCard } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');

module.exports = {
  name: 'inviteinfo',
  aliases: ['invinfo'],
  description: 'View invite information',
  usage: '<invite link|code>',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args, client) {
    if (!args[0]) return usageCard(message, { summary: 'View invite information', usage: '&inviteinfo <invite link|code>' });
    const code = args[0]
      .replace(/^<|>$/g, '')
      .replace(/^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\//i, '')
      .split(/[/?#]/)[0];
    const invite = await client.fetchInvite(code, { withCounts: true, withExpiration: true }).catch(() => null);
    if (!invite) return notice(message, '__That invite is invalid or has expired__');

    const guild = invite.guild;
    const lines = [
      `__Code__ : \`${invite.code}\``,
      guild ? `__Server__ : **${guild.name}** (\`${guild.id}\`)` : '__Server__ : Unknown',
      `__Channel__ : ${invite.channel ? `#${invite.channel.name}` : 'Unknown'}`,
      invite.inviter ? `__Inviter__ : ${invite.inviter.username} (\`${invite.inviter.id}\`)` : null,
      invite.memberCount != null
        ? `__Members__ : \`${comma(invite.memberCount)}\`${invite.presenceCount != null ? ` (\`${comma(invite.presenceCount)}\` online)` : ''}`
        : null,
      invite.expiresTimestamp ? `__Expires__ : <t:${Math.floor(invite.expiresTimestamp / 1000)}:R>` : '__Expires__ : Never',
      invite.createdTimestamp ? `__Created__ : <t:${Math.floor(invite.createdTimestamp / 1000)}:R>` : null,
      guild && guild.description ? `__Description__ : ${guild.description}` : null,
    ].filter(Boolean);
    await card(message, { title: 'Invite Information', lines });
  },
};
