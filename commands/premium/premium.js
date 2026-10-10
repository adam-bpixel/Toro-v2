const { card, notice, usageCard } = require('../../utils/render/embeds');
const { KINDS, isOwner, parseDays, isPermanent, addPremium } = require('../../models/economy/premium');

module.exports = {
  name: 'premium',
  aliases: [],
  description: 'Give premium to a user or a server (bot owner only)',
  usage: 'add <user|server> <id> [duration]',
  category: 'Premium Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const [action, kindArg, id, span] = args;
    const kind = (kindArg || '').toLowerCase();
    if ((action || '').toLowerCase() !== 'add' || !KINDS.includes(kind) || !id) {
      return usageCard(message, {
        summary: 'Give premium to a user or a server',
        usage: '&premium add <user|server> <id> [duration]',
        notes: ['`duration` : number of days - leave it out for permanent', '`&premium add user 123456789012345678 30`'],
      });
    }

    const clean = id.replace(/[<@!>]/g, '');
    if (!/^\d{15,25}$/.test(clean)) return notice(message, `__Please give a valid ${kind} ID__`);

    let ms = null;
    if (span && !isPermanent(span)) {
      ms = parseDays(span);
      if (!ms) return notice(message, '__Invalid duration - use a number of days, like `30`__');
    }

    const name = kind === 'user'
      ? (await message.client.users.fetch(clean).catch(() => null))?.tag
      : message.client.guilds.cache.get(clean)?.name;
    if (!name && kind === 'user') return notice(message, '__User not found__');

    const expiresAt = await addPremium(kind, clean, ms, message.author.id);
    return card(message, {
      title: 'Premium',
      lines: [
        `__${kind === 'user' ? 'User' : 'Server'}__ : ${name ? `${name} ` : ''}\`${clean}\``,
        `__Expires__ : ${expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:F> (<t:${Math.floor(expiresAt.getTime() / 1000)}:R>)` : 'Never'}`,
      ],
    });
  },
};
