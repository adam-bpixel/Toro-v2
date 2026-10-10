const { notice, divider, textBlock, COMPONENTS_V2, ACCENT_COLOR } = require('../../utils/render/embeds');
const { localize } = require('../../utils/localize');
const { LEADERBOARD_EMOJI: L } = require('../../utils/emojis');
const { clanIcon, buildPage, sendPaged } = require('../../utils/render/clanBoard');
const clans = require('../../models/economy/clans');
const guildStats = require('../../models/activity/guildStats');
const { topInviters } = require('../../handlers/security/inviteTracker');
const { topVerifiers } = require('../../models/enforcement/verification');
const { compact } = require('../../utils/format');

const SHOWN_MEMBERS = 3;
const PREV = 'topclans_prev';
const NEXT = 'topclans_next';

const hours = (ms) => Math.floor(ms / 3600000);
const rankMark = (rank) => (rank === 1 ? L.top : rank < 10 ? L.ranks[rank] : [...String(rank)].map((digit) => (digit === '0' ? L.zero : L.ranks[digit])).join(''));

function topMembers(clan) {
  return clan.memberIds
    .map((id) => ({ id, ms: (clan.hoursMs || {})[id] || 0 }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, SHOWN_MEMBERS);
}

function clanSection(guild, botIcon, clan, rank, viewerId) {
  const members = topMembers(clan).map((m, i) => `> -# ${L.ranks[i + 1]} <@${m.id}> ~ ${hours(m.ms)} hours`);
  if (clan.memberIds.includes(viewerId)) members.push('> -# ⟰  The clan you belong to');
  return {
    type: 9,
    components: [textBlock([`${rankMark(rank)} **${clan.name}** ~ ${hours(clans.totalHoursMs(clan))} hours`, ...members].join('\n'))],
    accessory: { type: 11, media: { url: clanIcon(guild, botIcon, clan) }, description: clan.name, spoiler: false },
  };
}

const TYPES = [
  ['clans', 'Top clans in this server'],
  ['members', 'Top members in your clan'],
  ['global', 'Top clans across all servers'],
  ['couples', 'Top relationships score globally'],
  ['verificator', 'Top verificators in this server'],
  ['voice', 'Top voice hours in this server'],
  ['chat', 'Top chat messages in this server'],
  ['invites', 'Top inviters in this server'],
];

const helpCard = () => ({
  flags: COMPONENTS_V2,
  components: [{
    type: 17,
    accent_color: ACCENT_COLOR,
    components: [
      textBlock('## Top Command'),
      divider(),
      textBlock(`- __\`&top <${TYPES.map(([key]) => key).join('|')}>\`__  ⁘\n- __View top leaderboards__  ⁘`),
      divider(),
      textBlock(TYPES.map(([key, text]) => `- __\`${key}\`__ — __${text}  ⁘__`).join('\n')),
    ],
    spoiler: false,
  }],
});

async function topClans(message) {
  const { guild } = message;
  if (!(await clans.topClans(guild.id)).length) return notice(message, '__There are no clans in this server yet__');

  const botIcon = message.client.user.displayAvatarURL({ size: 256 });
  const head = [textBlock(`## ${L.title} ${guild.name} 〃Leaderboard`), divider()];
  await sendPaged(message, {
    load: () => clans.topClans(guild.id),
    render: (ranked, page) => buildPage({
      head, ranked, page, prevId: PREV, nextId: NEXT,
      section: (clan, rank) => clanSection(guild, botIcon, clan, rank, message.author.id),
    }),
    prevId: PREV,
    nextId: NEXT,
  });
}

async function topClanMembers(message) {
  const { guild } = message;
  const mine = await clans.getClanOf(guild.id, message.author.id);
  if (!mine) return notice(message, "__You aren't in a clan__");

  const load = async () => {
    const fresh = await clans.getClan(guild.id, mine.clanId);
    return (fresh?.memberIds || []).map((id) => ({ id, ms: (fresh.hoursMs || {})[id] || 0 })).sort((a, b) => b.ms - a.ms);
  };
  const head = [textBlock(`## ${L.title} ${mine.name} 〃Members`), divider()];
  await sendPaged(message, {
    load,
    render: (ranked, page) => buildPage({
      head, ranked, page, prevId: 'topmembers_prev', nextId: 'topmembers_next',
      section: (member, rank) => textBlock(`${rankMark(rank)} <@${member.id}> ~ ${hours(member.ms)} hours`),
    }),
    prevId: 'topmembers_prev',
    nextId: 'topmembers_next',
  });
}

async function topGlobal(message) {
  if (!(await clans.topClansGlobal()).length) return notice(message, '__There are no clans yet__');

  const botIcon = message.client.user.displayAvatarURL({ size: 256 });
  const head = [textBlock(`## ${L.title} Global 〃Leaderboard`), divider()];
  await sendPaged(message, {
    load: () => clans.topClansGlobal(),
    render: (ranked, page) => buildPage({
      head, ranked, page, prevId: 'topglobal_prev', nextId: 'topglobal_next',
      section: (clan, rank) => {
        const home = message.client.guilds.cache.get(clan.guildId);
        return {
          type: 9,
          components: [textBlock(`${rankMark(rank)} **${clan.name}** ~ ${hours(clans.totalHoursMs(clan))} hours
> -# ${home ? home.name : 'Unknown server'}`)],
          accessory: { type: 11, media: { url: clan.avatarUrl || home?.iconURL({ size: 256 }) || botIcon }, description: clan.name, spoiler: false },
        };
      },
    }),
    prevId: 'topglobal_prev',
    nextId: 'topglobal_next',
  });
}

async function topChat(message) {
  const { guild } = message;
  const load = () => guildStats.top(guild.id, 'messages');
  if (!(await load()).length) return notice(message, '__No messages have been counted in this server yet__');

  const head = [textBlock(`## ${L.messages} ${guild.name} 〃Chat Leaderboard`), divider()];
  await sendPaged(message, {
    load,
    render: (ranked, page) => buildPage({
      head, ranked, page, perPage: 10, prevId: 'topchat_prev', nextId: 'topchat_next',
      section: (row, rank) => textBlock(`${rankMark(rank)} <@${row.userId}> ~ ${compact(row.messages)} messages`),
    }),
    prevId: 'topchat_prev',
    nextId: 'topchat_next',
    perPage: 10,
  });
}

async function topInvites(message) {
  const { guild } = message;
  const load = () => topInviters(guild.id);
  if (!(await load()).length) return notice(message, '__No invites have been counted in this server yet__');

  const head = [textBlock(`## ${L.invite} ${guild.name} 〃Invites Leaderboard`), divider()];
  await sendPaged(message, {
    load,
    render: (ranked, page) => buildPage({
      head, ranked, page, perPage: 10, prevId: 'topinvites_prev', nextId: 'topinvites_next',
      section: (row, rank) => textBlock(`${rankMark(rank)} <@${row._id}>\n> -# ${L.invites} ${row.invites} | ${L.fake} ${row.fake} | ${L.left} ${row.left}`),
    }),
    prevId: 'topinvites_prev',
    nextId: 'topinvites_next',
    perPage: 10,
  });
}

async function topVerificators(message) {
  const { guild } = message;
  const load = () => topVerifiers(guild.id);
  if (!(await load()).length) return notice(message, '__No verifications have been counted in this server yet__');

  const head = [textBlock(`## ${L.title} ${guild.name} 〃Verificators Leaderboard`), divider()];
  await sendPaged(message, {
    load,
    render: (ranked, page) => buildPage({
      head, ranked, page, perPage: 10, prevId: 'topverif_prev', nextId: 'topverif_next',
      section: (row, rank) => textBlock(`${rankMark(rank)} <@${row._id}> ~ ${compact(row.count)} verified`),
    }),
    prevId: 'topverif_prev',
    nextId: 'topverif_next',
    perPage: 10,
  });
}

const BOARDS = { clans: topClans, members: topClanMembers, global: topGlobal, chat: topChat, invites: topInvites, verificator: topVerificators };
const TYPE_ALIASES = { verif: 'verificator', verifs: 'verificator' };

module.exports = {
  name: 'top',
  aliases: ['lb'],
  description: 'View top leaderboards',
  usage: `<${TYPES.map(([key]) => key).join('|')}>`,
  category: 'Clans Commands',
  async execute(message, args) {
    const type = TYPE_ALIASES[(args[0] || '').toLowerCase()] || (args[0] || '').toLowerCase();
    if (!TYPES.some(([key]) => key === type)) return message.reply(await localize(message, { ...helpCard(), allowedMentions: { repliedUser: true } }));
    if (!BOARDS[type]) return notice(message, '__This leaderboard is not set up yet__');
    if (!message.guild && type !== 'global') return notice(message, '__This command can only be used in a server__');
    return BOARDS[type](message);
  },
};
