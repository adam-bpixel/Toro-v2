const { EmbedBuilder } = require('discord.js');
const { resolveRole } = require('../../utils/access/resolve');
const { card, notice } = require('../../utils/render/embeds');

const block = (value) => `\`\`\`${String(value).replaceAll('```', "'''")}\`\`\``;
const yesNo = (value) => (value ? 'Yes' : 'No');

function formatCreatedAt(date) {
  const [weekday, day, month, year, time] = date.toUTCString().replace(',', '').split(' ');
  return `${weekday} ${month} ${day} ${year} ${time} GMT (Greenwich Mean Time Zone)`;
}

function formatPermissions(permissions) {
  const names = permissions.toArray();
  if (names.includes('Administrator')) return 'Administrator';
  if (!names.length) return 'None';
  const text = names.map((name) => name.replace(/([a-z])([A-Z])/g, '$1 $2')).join(', ');
  return text.length > 1018 ? `${text.slice(0, 1015)}...` : text;
}

module.exports = {
  name: 'roleinfo',
  aliases: ['rinfo', 'ri'],
  description: 'View information about a role',
  usage: '<@role|roleID|rolename>',
  category: 'Roles Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, { title: 'Role Info Command', lines: ['__`&roleinfo <@role|roleID|rolename>`__', '__Get detailed information about a role__'] });
    }

    const role = resolveRole(message, args.join(' '));
    if (!role) return notice(message, "__Couldn't find that role__");

    await message.guild.members.fetch().catch(() => {});

    const bot = message.guild.members.me || message.client.user;

    const embed = new EmbedBuilder()
      .setColor(role.color)
      .setAuthor({ name: 'Role Information', iconURL: bot.displayAvatarURL() })
      .addFields(
        { name: '**Name :**', value: block(role.name), inline: true },
        { name: '**ID :**', value: block(role.id), inline: true },
        { name: '**Position :**', value: block(role.position), inline: false },
        { name: '**Color :**', value: block(role.hexColor), inline: false },
        { name: '**Members :**', value: block(role.members.size), inline: false },
        { name: '**Mentionable :**', value: block(yesNo(role.mentionable)), inline: true },
        { name: '**Hoisted :**', value: block(yesNo(role.hoist)), inline: true },
        { name: '**Managed :**', value: block(yesNo(role.managed)), inline: true },
        { name: '**Permissions :**', value: block(formatPermissions(role.permissions)), inline: false },
        { name: '**Created At :**', value: block(formatCreatedAt(role.createdAt)), inline: false },
      )
      .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

    await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  },
};
