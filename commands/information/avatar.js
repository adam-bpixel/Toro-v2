const { resolveUser } = require('../../utils/access/resolve');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'useravatar', 'pfp', 'a', 'profilepicture'],
  description: "View a user's avatar",
  usage: '[ID|@member|username]',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    const target = await resolveUser(message, args);
    const avatarURL = target.displayAvatarURL({ size: 1024 });
    const member = message.guild
      ? (message.guild.members.cache.get(target.id) || await message.guild.members.fetch(target.id).catch(() => null))
      : null;
    const serverURL = member && member.avatarURL({ size: 1024 });

    const footer = {
      text: `Requested by ${message.author.username}`,
      icon_url: message.author.displayAvatarURL({ size: 256 }),
    };
    const embeds = [
      {
        description: `[Global Avatar](${avatarURL})`,
        color: 13944790,
        author: { name: `${target.username}'s Avatar`, icon_url: avatarURL },
        image: { url: avatarURL },
      },
    ];
    if (serverURL) {
      embeds.push({
        description: `[Server Avatar](${serverURL})`,
        color: 13944790,
        image: { url: serverURL },
        footer,
      });
    } else {
      embeds[0].author.name = `${target.username}'s Global Avatar`;
      embeds[0].footer = footer;
    }

    await message.reply({ embeds, allowedMentions: { repliedUser: true } });
  },
};
