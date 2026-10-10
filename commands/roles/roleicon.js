const { resolveManagedRole } = require('../../utils/access/roleTarget');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'roleicon',
  aliases: [],
  description: 'Change role icon',
  usage: '<@role|roleID|rolename> <emoji|URL|attachment>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Roleicon Command',
        lines: ['__`&roleicon <@role|roleID|rolename> <emoji|URL|attachment>`__'],
      });
    }

    const result = resolveManagedRole(message, args[0]);
    if (result.error) return notice(message, `__${result.error}__`);
    const { role } = result;

    const attachment = message.attachments.first();
    const input = args[1];
    const customEmoji = input && input.match(/^<(a?):[^:]+:(\d+)>$/);
    const boostNotice = '__Role icons need this server to be boost level 2 or higher__';

    let applied = null;
    if (attachment) {
      applied = await role.setIcon(attachment.url).catch(() => null);
    } else if (customEmoji) {
      const url = `https://cdn.discordapp.com/emojis/${customEmoji[2]}.${customEmoji[1] ? 'gif' : 'png'}`;
      applied = await role.setIcon(url).catch(() => null);
    } else if (input && /^https?:\/\//.test(input)) {
      applied = await role.setIcon(input).catch(() => null);
    } else if (input) {
      applied = await role.setUnicodeEmoji(input).catch(() => null);
    } else {
      return notice(message, '__Give an emoji, URL, or attach an image__');
    }

    if (!applied) return notice(message, boostNotice);
    await card(message, { title: 'Roleicon Command', lines: [`__Updated the icon for__ ${role}`] });
  },
};
