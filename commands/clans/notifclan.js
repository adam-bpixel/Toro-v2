const { container, notice, COMPONENTS_V2 } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const MAX_LENGTH = 500;
const COOLDOWN_MS = 45 * 1000;

module.exports = {
  name: 'notifclan',
  aliases: [],
  description: 'Send a notification to your clan by tagging the clan role',
  usage: '[message]',
  category: 'Clans Commands',
  async execute(message, args) {
    const text = args.join(' ').trim();
    if (text.length > MAX_LENGTH) return notice(message, `__Notifications are limited to ${MAX_LENGTH} characters__`);

    const clan = await clans.requireClanRank(message);
    if (!clan) return;
    const role = message.guild.roles.cache.get(clan.roleId);
    if (!role) return notice(message, '__The clan role no longer exists__');

    const cooldownKey = `notifclan:${message.guild.id}:${clan.clanId}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;

    const wasMentionable = role.mentionable;
    if (!wasMentionable) await role.setMentionable(true, 'Clan notification').catch(() => {});

    const payload = text
      ? {
        flags: COMPONENTS_V2,
        components: [container({
          title: `${clan.name} - Notification`,
          lines: [`${role}`, `__Message__ : ${text}`, `__Sent by__ ${message.author} - <t:${Math.floor(Date.now() / 1000)}:R>`],
        })],
        allowedMentions: { parse: [], roles: [role.id] },
      }
      : { content: `${role}`, allowedMentions: { parse: [], roles: [role.id] } };

    await message.channel
      .send(payload)
      .then(() => {
        clans.startCooldown(cooldownKey);
        return message.delete().catch(() => {});
      })
      .finally(() => (wasMentionable ? null : role.setMentionable(false, 'Clan notification').catch(() => {})));
  },
};
