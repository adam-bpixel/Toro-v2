const { resolveUser } = require('../../utils/access/resolve');
const { notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'banner',
  aliases: ['userbanner', 'ub', 'b'],
  description: "View a user's banner",
  usage: '[ID|@member|username]',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    const target = await resolveUser(message, args);
    const fetched = await message.client.users.fetch(target.id, { force: true }).catch(() => null);
    const bannerURL = fetched && fetched.bannerURL({ size: 4096 });
    const member = message.guild
      ? await message.guild.members.fetch({ user: target.id, force: true }).catch(() => null)
      : null;
    const serverURL = member && member.bannerURL({ size: 4096 });

    if (!bannerURL && !serverURL) {
      const isSelf = target.id === message.author.id;
      return notice(message, `__Opsss, ${isSelf ? "you don't" : "this user doesn't"} have a banner__`);
    }

    const footer = {
      text: `Requested by ${message.author.username}`,
      icon_url: message.author.displayAvatarURL({ size: 256 }),
    };
    const embeds = [];
    if (bannerURL) {
      embeds.push({
        description: `[Banner Link](${bannerURL})`,
        color: 13944790,
        author: {
          name: `${target.username}'s ${serverURL ? 'Banner' : 'Global Banner'}`,
          icon_url: target.displayAvatarURL({ size: 256 }),
        },
        image: { url: bannerURL },
      });
    }
    if (serverURL) {
      embeds.push({
        description: `[Banner Link](${serverURL})`,
        color: 13944790,
        ...(bannerURL ? {} : {
          author: { name: `${target.username}'s Server Banner`, icon_url: target.displayAvatarURL({ size: 256 }) },
        }),
        image: { url: serverURL },
      });
    }
    embeds[embeds.length - 1].footer = footer;

    await message.reply({ embeds, allowedMentions: { repliedUser: true } });
  },
};
