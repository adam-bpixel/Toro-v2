const { PermissionFlagsBits } = require('discord.js');
const { notice, usageCard } = require('../../utils/render/embeds');
const moderation = require('../../services/moderation');

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
    return moderation.editPermission(message, { id, flag: FLAG_BY_NAME.get(norm(args[1])), state: args[2].toLowerCase() });
  },
};
