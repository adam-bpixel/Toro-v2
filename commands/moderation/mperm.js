const { PermissionFlagsBits } = require('discord.js');
const { checkTarget, checkRoleTarget } = require('../../utils/access/permissions');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');

const STATES = { allow: true, deny: false, reset: null };
const SHOWN = { true: 'Allowed', false: 'Denied', null: 'Reset' };
const norm = (text) => String(text).toLowerCase().replace(/[\s_-]/g, '');
const FLAG_BY_NAME = new Map(Object.keys(PermissionFlagsBits).map((name) => [norm(name), name]));

module.exports = {
  name: 'mperm',
  aliases: [],
  description: 'Give or remove member permissions in any channel',
  usage: '<@member|@role|ID> <permission> <allow|deny|reset>',
  category: 'Moderation Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return notice(message, "__You don't have permission__");
    }
    if (args.length < 3) {
      return usageCard(message, {
        summary: 'Give or remove member permissions in any channel',
        usage: '&mperm <@member|@role|ID> <permission> <allow|deny|reset>',
        notes: ['Permission: send_messages, view_channel, connect, speak, attach_files, embed_links...', 'Applies only in the channel you use it in', 'Requires Manage Roles permission'],
      });
    }

    const id = (args[0].match(/^<@[!&]?(\d+)>$/) || [])[1] || (/^\d{15,25}$/.test(args[0]) ? args[0] : null);
    if (!id) return notice(message, '__Mention a member or a role, or give an ID__');
    const role = message.guild.roles.cache.get(id);
    const member = role ? null : await message.guild.members.fetch(id).catch(() => null);
    if (!role && !member) return notice(message, "__Couldn't find that member or role__");

    const check = role ? checkRoleTarget(message, role) : member.id === message.author.id ? { ok: true } : checkTarget(message, member);
    if (!check.ok) return notice(message, `__${check.reason}__`);

    const flag = FLAG_BY_NAME.get(norm(args[1]));
    if (!flag) return notice(message, "__That isn't a permission (try `send_messages`, `view_channel`, `connect`...)__");
    const state = args[2].toLowerCase();
    if (!(state in STATES)) return notice(message, '__State must be `allow`, `deny` or `reset`__');
    const channel = message.channel;
    if (!channel.permissionOverwrites) return notice(message, "__Permissions can't be changed in this channel__");

    if (STATES[state] === true && message.guild.ownerId !== message.author.id && !channel.permissionsFor(message.member).has(PermissionFlagsBits[flag])) {
      return notice(message, "__You can't allow a permission you don't have in that channel__");
    }

    const done = await channel.permissionOverwrites.edit(id, { [flag]: STATES[state] }, { reason: `mperm by ${message.author.username}` }).then(() => true).catch(() => false);
    if (!done) return notice(message, "__Couldn't change that permission (check my permissions in that channel)__");
    await card(message, {
      title: `${EMOJI.success} Permission`,
      lines: [`__${SHOWN[String(STATES[state])]}__ \`${flag}\` __for__ ${role || member} __in__ ${channel}`],
    });
  },
};
