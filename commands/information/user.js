const { resolveUser } = require('../../utils/access/resolve');
const { USER_BADGE_EMOJI, EMOJI } = require('../../utils/emojis');
const { notice } = require('../../utils/render/embeds');
const { isPremium, isOwner } = require('../../models/economy/premium');

const FLAG_BADGES = [
  ['Staff', 'staff'],
  ['Partner', 'partner'],
  ['CertifiedModerator', 'certifiedModerator'],
  ['Hypesquad', 'hypesquad'],
  ['BugHunterLevel1', 'bugHunter1'],
  ['BugHunterLevel2', 'bugHunter2'],
  ['HypeSquadOnlineHouse1', 'house1'],
  ['HypeSquadOnlineHouse2', 'house2'],
  ['HypeSquadOnlineHouse3', 'house3'],
  ['PremiumEarlySupporter', 'earlySupporter'],
  ['VerifiedDeveloper', 'verifiedDeveloper'],
  ['ActiveDeveloper', 'activeDeveloper'],
  ['VerifiedBot', 'verifiedBot'],
];
const BOOST_MONTHS = [0, 2, 3, 6, 9, 12, 15, 18, 24];
const MONTH_MS = 30.44 * 86400000;
const EXCLUSIVE_BADGE = { userId: '1475262022307545112', emoji: USER_BADGE_EMOJI.badge5 };

function badgesOf(user, member) {
  const flags = user.flags ? user.flags.toArray() : [];
  const icons = FLAG_BADGES.filter(([flag]) => flags.includes(flag)).map(([, key]) => USER_BADGE_EMOJI[key]);
  if (user.banner || (user.avatar && user.avatar.startsWith('a_'))) icons.push(USER_BADGE_EMOJI.nitro);
  if (member && member.premiumSinceTimestamp) {
    const months = (Date.now() - member.premiumSinceTimestamp) / MONTH_MS;
    const level = BOOST_MONTHS.filter((from) => months >= from).length;
    icons.push(USER_BADGE_EMOJI.boost[Math.max(level, 1) - 1]);
  }
  return icons;
}

function formatPermissions(permissions) {
  if (permissions.has('Administrator')) return 'Administrator (all permissions)';
  const names = permissions.toArray();
  if (!names.length) return 'None';
  const shown = names.slice(0, 5).join(', ');
  return names.length > 5 ? `${shown} and ${names.length - 5} more` : shown;
}

module.exports = {
  name: 'user',
  aliases: ['userinfo', 'whois', 'u', 'ui', 'who'],
  description: "View a user's Discord and server information",
  usage: '[ID|@member|username]',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    let target = await resolveUser(message, args, { fallbackToAuthor: !args.length });
    if (!target && message.guild) {
      const query = args.join(' ').replace(/^@/, '').toLowerCase();
      const found = message.guild.members.cache.find((m) => [m.user.username, m.displayName, m.nickname, m.user.globalName]
        .some((name) => name && name.toLowerCase().includes(query)));
      target = found ? found.user : null;
    }
    if (!target) return notice(message, "__Couldn't find that user__");
    const fetched = await message.client.users.fetch(target.id, { force: true }).catch(() => null);
    const user = fetched || target;

    const member = message.guild
      ? message.mentions.members?.first() ||
        message.guild.members.cache.get(user.id) ||
        (await message.guild.members.fetch(user.id).catch(() => null))
      : null;

    const badges = badgesOf(user, member);
    const userPremium = isOwner(user.id) || await isPremium('user', user.id);
    const rareBadges = [];
    if (user.id === EXCLUSIVE_BADGE.userId) rareBadges.push(EXCLUSIVE_BADGE.emoji);
    rareBadges.push(userPremium ? EMOJI.premiumActive : EMOJI.premiumFree);

    const topRoles = member
      ? [...member.roles.cache.values()]
          .filter((r) => r.id !== message.guild.id)
          .sort((a, b) => b.position - a.position)
          .slice(0, 3)
          .map((r) => `${r}`)
      : [];

    const tag = user.primaryGuild?.identityEnabled ? user.primaryGuild.tag : null;
    const tagBadge = tag ? user.guildTagBadgeURL({ size: 64 }) : null;

    const fields = [
      { name: '・ __Username__', value: user.username, inline: true },
      { name: '・ __ID__', value: `\`${user.id}\``, inline: true },
      { name: '・ __Joined Discord__', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      {
        name: '・ __Joined Server__',
        value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Not in this server',
        inline: true,
      },
      {
        name: '・ __Permissions__',
        value: member ? formatPermissions(member.permissions) : 'Not in this server',
        inline: false,
      },
      {
        name: '・ __Top Roles__',
        value: topRoles.length ? topRoles.join(' ') : 'None',
        inline: false,
      },
      { name: '・ __Badges__', value: badges.length ? badges.join(' ') : 'None', inline: false },
      { name: '・ __Rare Badges__', value: rareBadges.join(' '), inline: false },
    ];

    await message.reply({
      embeds: [
        {
          color: 13944790,
          author: { name: (member && member.displayName) || user.displayName || user.username, icon_url: user.displayAvatarURL({ size: 256 }) },
          thumbnail: { url: user.displayAvatarURL({ size: 256 }) },
          fields,
          ...(tag ? { footer: { text: tag, ...(tagBadge ? { icon_url: tagBadge } : {}) } } : {}),
        },
      ],
      allowedMentions: { repliedUser: true },
    });
  },
};
