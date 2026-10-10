const { PermissionFlagsBits } = require('discord.js');
const { notice, textBlock, divider, bullet, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');
const { resolveUser } = require('../../utils/access/resolve');
const { INVITES_EMOJI } = require('../../utils/emojis');
const { statsFor } = require('../../handlers/security/inviteTracker');

module.exports = {
  name: 'invites',
  aliases: [],
  description: 'Show invite stats for a user',
  usage: '[ID|@member|username]',
  category: 'Information Commands',
  async execute(message, args) {
    if (!message.guild) return notice(message, '__This command only works inside a server__');
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return notice(message, '__I need the **Manage Server** permission to track invites__');
    }
    const target = await resolveUser(message, args);
    const stats = await statsFor(message.guild.id, target.id).catch(() => null);
    if (!stats) return notice(message, '__Could not read the invite stats right now__');

    const member = message.guild.members.cache.get(target.id) || await message.guild.members.fetch(target.id).catch(() => null);
    const name = (member && member.displayName) || target.displayName || target.username;
    const lines = [
      `__Valid__ : \`${comma(stats.valid)}\``,
      `__Fake__ : \`${comma(stats.fake)}\``,
      `__Left__ : \`${comma(stats.left)}\``,
    ].map(bullet).join('\n');

    await message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          textBlock(`## ${INVITES_EMOJI} ${name}'s Invites`),
          divider(),
          {
            type: 9,
            components: [textBlock(lines)],
            accessory: { type: 11, media: { url: (member || target).displayAvatarURL({ extension: 'png', size: 256 }) } },
          },
        ],
      }],
      allowedMentions: { repliedUser: true },
    });
  },
};
