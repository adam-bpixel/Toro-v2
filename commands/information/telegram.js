const { card, notice, usageCard } = require('../../utils/render/embeds');

const decode = (text) => text
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();

module.exports = {
  name: 'telegram',
  aliases: ['tg'],
  description: 'Show Telegram profile information',
  usage: '<username>',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    const username = (args[0] || '').replace(/^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)/i, '').replace(/^@/, '').split(/[/?#]/)[0];
    if (!/^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(username)) {
      return usageCard(message, { summary: 'Show Telegram profile information', usage: '&telegram <username>' });
    }
    const html = await fetch(`https://t.me/${username}`, { signal: AbortSignal.timeout(10000) })
      .then((r) => r.text()).catch(() => null);
    if (!html) return notice(message, '__Could not reach Telegram, try again later__');

    const title = (html.match(/<div class="tgme_page_title"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
    if (!title) return notice(message, `__No Telegram profile found for **${username}**__`);
    const extra = (html.match(/<div class="tgme_page_extra"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
    const about = (html.match(/<div class="tgme_page_description[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
    const isBot = /tgme_page_context_link|Start Bot|>Send Message</.test(html) && /_bot$/i.test(username);

    const lines = [
      `__Name__ : ${decode(title)}`,
      `__Username__ : @${username}`,
      extra ? `__Info__ : ${decode(extra)}` : null,
      isBot ? '__Type__ : Bot' : null,
      about ? `__Bio__ : ${decode(about).slice(0, 300)}` : null,
      `__Link__ : https://t.me/${username}`,
    ].filter(Boolean);
    await card(message, { title: 'Telegram Profile', lines });
  },
};
