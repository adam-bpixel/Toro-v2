'use strict';
const { card, notice, usageCard, container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { resolveUser } = require('../../utils/access/resolve');
const { isBlacklisted, getEntry, listBlacklist, addToBlacklist, removeFromBlacklist } = require('../../models/core/blacklist');
const { EMOJI, HONEYPOT_EMOJI } = require('../../utils/emojis');

const BOT_LOGO_EMOJI = HONEYPOT_EMOJI.brand;

const USAGE = '&blacklist <add|remove|list> [user] [reason]';

async function dmUser(user, { title, lines, accentColor }) {
  return user.send({
    flags: COMPONENTS_V2,
    components: [container({ accentColor, title, lines })],
    allowedMentions: { parse: [] },
  }).catch(() => false);
}

module.exports = {
  name: 'blacklist',
  aliases: ['bl'],
  description: "Owner only - block a user from using the bot's commands",
  usage: '<add|remove|list> [ID|@member|username] [reason]',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'remove', 'list'].includes(sub)) {
      return usageCard(message, {
        summary: "Block or unblock a user from using the bot's commands",
        usage: USAGE,
        notes: ['`add` : blacklist a user', '`remove` : unblacklist a user', '`list` : show every blacklisted user'],
      });
    }

    if (sub === 'list') {
      const entries = listBlacklist();
      if (!entries.length) return notice(message, '__No one is blacklisted__');
      const lines = entries
        .sort((a, b) => b.addedAt - a.addedAt)
        .slice(0, 25)
        .map((entry) => `<@${entry._id}> \`(${entry._id})\` - ${entry.reason}`);
      return card(message, { title: `${BOT_LOGO_EMOJI} Blacklisted Users`, lines });
    }

    const target = await resolveUser(message, args.slice(1), { fallbackToAuthor: false });
    const reason = args.slice(2).join(' ') || 'No reason provided';
    if (!target) return usageCard(message, { summary: "Block or unblock a user from using the bot's commands", usage: USAGE });
    if (isOwner(target.id)) return notice(message, "__You can't blacklist the bot owner__");

    if (sub === 'add') {
      if (isBlacklisted(target.id)) return notice(message, `__${target} is already blacklisted__`);
      await addToBlacklist(target.id, reason, message.author.id);
      const reply = await card(message, {
        title: `${EMOJI.success} Blacklisted`,
        lines: [`__Blacklisted__ ${target}`, `__Reason__ : ${reason}`],
      });
      dmUser(target, {
        title: `${BOT_LOGO_EMOJI} Blacklisted`,
        lines: [`__You have been blacklisted from using my commands.__`, `__Reason__ : ${reason}`],
      });
      return reply;
    }

    const entry = getEntry(target.id);
    if (!entry) return notice(message, `__${target} isn't blacklisted__`);
    await removeFromBlacklist(target.id);
    const reply = await card(message, {
      title: `${EMOJI.success} Unblacklisted`,
      lines: [`__Unblacklisted__ ${target}`, `__Reason__ : ${reason}`],
    });
    dmUser(target, {
      title: `${BOT_LOGO_EMOJI} Unblacklisted`,
      lines: [`__You have been removed from the blacklist and can use my commands again.__`, `__Reason__ : ${reason}`],
    });
    return reply;
  },
};
