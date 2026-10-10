const { notice, usageCard } = require('../../utils/render/embeds');
const { resolveUser } = require('../../utils/access/resolve');

module.exports = {
  name: 'whisper',
  aliases: [],
  description: 'Send anonymous whisper message to a user',
  usage: '<ID|@member|username> <message>',
  category: 'Information Commands',
  async execute(message, args) {
    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    const rest = message.mentions.users.size ? args.filter((a) => !/^<@!?\d+>$/.test(a)) : args.slice(1);
    const text = rest.join(' ').trim();
    if (!args.length || !target || !text) {
      return usageCard(message, { summary: 'Send anonymous whisper message to a user', usage: '&whisper <ID|@member|username> <message>' });
    }
    if (target.bot) return notice(message, '__You cannot whisper to a bot__');
    if (target.id === message.author.id) return notice(message, '__You cannot whisper to yourself__');
    if (text.length > 1500) return notice(message, '__The message can be 1500 characters at most__');

    if (message.deletable) await message.delete().catch(() => {});

    const sent = await target.send({
      embeds: [{
        title: 'Anonymous Whisper',
        description: text,
        color: 13944790,
        footer: { text: message.guild ? `Sent from ${message.guild.name}` : 'Sent anonymously' },
        timestamp: new Date().toISOString(),
      }],
      allowedMentions: { parse: [] },
    }).catch(() => null);

    const reply = sent ? '__Your whisper was delivered anonymously__' : `__Could not DM **${target.username}**, their DMs are closed__`;
    const note = await message.channel.send({ content: `${message.author} ${reply}`, allowedMentions: { users: [message.author.id] } }).catch(() => null);
    if (note) setTimeout(() => note.delete().catch(() => {}), 5000);
  },
};
