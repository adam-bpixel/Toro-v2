const { AttachmentBuilder } = require('discord.js');
const { notice, usageCard } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');

const MAX_UPLOAD = 24 * 1024 * 1024;

module.exports = {
  name: 'tiktok',
  aliases: ['tt'],
  description: 'Download TikTok videos and photo posts',
  usage: '<TikTok link>',
  category: 'Information Commands',
  async execute(message, args) {
    const url = (args[0] || '').replace(/^<|>$/g, '');
    if (!/^https?:\/\/(?:[\w-]+\.)?tiktok\.com\//i.test(url)) {
      return usageCard(message, { summary: 'Download TikTok videos and photo posts', usage: '&tiktok <TikTok link>' });
    }
    await message.channel.sendTyping().catch(() => {});
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, { signal: AbortSignal.timeout(20000) })
      .then((r) => r.json()).catch(() => null);
    const data = res && res.code === 0 ? res.data : null;
    if (!data) return notice(message, '__Could not download that TikTok, check the link and try again__');

    const author = data.author ? `@${data.author.unique_id}` : 'unknown';
    const caption = `**${author}** - ${comma(data.digg_count || 0)} likes - ${comma(data.play_count || 0)} views${data.title ? `\n${data.title.slice(0, 300)}` : ''}`;
    const allowedMentions = { repliedUser: false, parse: [] };

    if (Array.isArray(data.images) && data.images.length) {
      const images = data.images.slice(0, 10);
      return message.reply({
        content: caption,
        embeds: images.map((image) => ({ url: 'https://www.tiktok.com', image: { url: image }, color: 13944790 })),
        allowedMentions,
      });
    }

    const source = data.hdplay || data.play;
    const file = source ? await fetch(source, { signal: AbortSignal.timeout(30000) })
      .then(async (r) => (r.ok ? Buffer.from(await r.arrayBuffer()) : null)).catch(() => null) : null;
    if (file && file.length <= MAX_UPLOAD) {
      return message.reply({ content: caption, files: [new AttachmentBuilder(file, { name: 'tiktok.mp4' })], allowedMentions });
    }
    await message.reply({ content: `${caption}\n${source || url}`, allowedMentions });
  },
};
