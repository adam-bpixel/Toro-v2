const { resolveUser } = require('../../utils/access/resolve');
const { card, notice } = require('../../utils/render/embeds');

module.exports = {
  name: 'locate',
  aliases: [],
  description: "Show user's current voice channel with members",
  usage: '[ID|@member|username]',
  category: 'Voice Commands',
  async execute(message, args) {
    const target = await resolveUser(message, args);
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__Couldn't find that user in this server__");

    if (!member.voice.channel) {
      return notice(message, `__${member.user.username} is not in a voice channel__`);
    }

    const channel = member.voice.channel;
    const members = [...channel.members.values()].map((m) => `${m}`);
    await card(message, {
      title: 'Locate',
      lines: [
        `__${member.user.username} is in__ ${channel}`,
        `__Members (${members.length})__ : ${members.join(', ') || 'none'}`,
      ],
    });
  },
};
