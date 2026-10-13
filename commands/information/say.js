const { AttachmentBuilder } = require('discord.js');
const { notice, usageCard } = require('../../utils/render/embeds');

module.exports = {
  name: 'say',
  aliases: ['tts'],
  description: 'Convert text to voice message',
  usage: '<text>',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    const text = args.join(' ').replace(/<a?:\w+:\d+>|<[@#][&!]?\d+>/g, '').trim();
    if (!text) return usageCard(message, { summary: 'Convert text to voice message', usage: '&say <text>' });
    if (text.length > 200) return notice(message, '__The text can be 200 characters at most__');

    const lang = /[؀-ۿ]/.test(text) ? 'ar' : 'en';
    const audio = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) },
    ).then(async (r) => (r.ok ? Buffer.from(await r.arrayBuffer()) : null)).catch(() => null);
    if (!audio || !audio.length) return notice(message, '__Could not generate the voice message, try again later__');

    await message.reply({
      files: [new AttachmentBuilder(audio, { name: 'voice-message.mp3' })],
      allowedMentions: { repliedUser: false },
    });
  },
};
