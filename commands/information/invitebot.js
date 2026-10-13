const { localize } = require('../../utils/localize');

module.exports = {
  name: 'invitebot',
  aliases: [],
  description: 'Get the invite link and support server for the bot',
  usage: '',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message) {
    const inviteURL = `https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&permissions=8&integration_type=0&scope=bot`;
    await message.reply(await localize(message, {
      content: `- [Press here to add ${message.client.user.username}.](${inviteURL})\n*If you need any help, use the \`&support\` command to get in touch with the developers*`,
      allowedMentions: { repliedUser: true },
    }));
  },
};
