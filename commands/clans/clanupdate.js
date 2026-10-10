const { resolveUser, resolveRole } = require('../../utils/access/resolve');
const { checkRoleTarget } = require('../../utils/access/permissions');
const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const TITLE = 'Clan Update Command';
const USAGE_LINES = [
  '__Update Name__',
  '__`&clanupdate <clanID> name <newName>`__',
  '__Update Member Limit__',
  '__`&clanupdate <clanID> limit <number>`__',
  '__Update Co-Leader Limit__',
  '__`&clanupdate <clanID> coleaderlimit <number>`__',
  '__Transfer Leadership__',
  '__`&clanupdate <clanID> leader <@user|userID>`__',
  '__Update Member Hours__',
  '__`&clanupdate <clanID> hours <@user|userID> <hours>`__',
  '__Add Co-Leader__',
  '__`&clanupdate <clanID> addcoleader <@user|userID>`__',
  '__Remove Co-Leader__',
  '__`&clanupdate <clanID> removecoleader <@user|userID>`__',
  '__Update Tag (shown in every member nickname)__',
  '__`&clanupdate <clanID> tag <TAG|off> [prefix|suffix]`__',
  '__Update Colour__',
  '__`&clanupdate <clanID> color <hex>`__',
  '__Update Avatar__',
  '__`&clanupdate <clanID> avatar <imageURL|off>`__',
  '__Update Clan Role__',
  '__`&clanupdate <clanID> clanrole <@role|roleID|rolename>`__',
  '__Requires Administrator or Clan Manager role__',
];

const done = (message, line) => card(message, { title: TITLE, lines: [line] });
const failed = (message, problem) => notice(message, `__${problem}__`);
const targetUser = (message, rest) => resolveUser(message, rest, { fallbackToAuthor: false });

const SUBCOMMANDS = {
  async name(message, clan, rest) {
    const name = rest.join(' ').trim();
    const problem = await clans.renameClan(message.guild, clan, name);
    return problem ? failed(message, problem) : done(message, `__Renamed__ **${clan.name}** __to__ **${name}**`);
  },

  async limit(message, clan, rest) {
    const limit = clans.parseCount(rest[0]);
    if (limit === null) return failed(message, 'Limit must be a whole number');
    const problem = await clans.setMemberLimit(message.guild, clan, limit);
    return problem ? failed(message, problem) : done(message, `__Member limit of__ **${clan.name}** __is now__ ${limit}`);
  },

  async coleaderlimit(message, clan, rest) {
    const limit = clans.parseCount(rest[0]);
    if (limit === null) return failed(message, 'Limit must be a whole number');
    const problem = await clans.setCoLeaderLimit(message.guild, clan, limit);
    return problem ? failed(message, problem) : done(message, `__Co-leader limit of__ **${clan.name}** __is now__ ${limit}`);
  },

  async leader(message, clan, rest) {
    const target = await targetUser(message, rest);
    if (!target) return failed(message, "Couldn't find that user");
    const problem = await clans.transferLeader(message.guild, clan, target.id);
    return problem ? failed(message, problem) : done(message, `__Leader of__ **${clan.name}** __is now__ **${target.username}**`);
  },

  async hours(message, clan, rest) {
    const target = await targetUser(message, rest);
    if (!target) return failed(message, "Couldn't find that user");
    const hours = /^\d+(\.\d+)?$/.test(rest[1] || '') ? Number(rest[1]) : null;
    if (hours === null) return failed(message, 'Hours must be a number');
    const problem = await clans.setMemberHours(message.guild, clan, target.id, hours);
    return problem ? failed(message, problem) : done(message, `__Set__ **${target.username}**__'s hours to__ ${hours}`);
  },

  async addcoleader(message, clan, rest) {
    const target = await targetUser(message, rest);
    if (!target) return failed(message, "Couldn't find that user");
    const problem = await clans.promoteCoLeader(message.guild, clan, target.id);
    return problem ? failed(message, problem) : done(message, `__Added__ **${target.username}** __as a co-leader of__ **${clan.name}**`);
  },

  async removecoleader(message, clan, rest) {
    const target = await targetUser(message, rest);
    if (!target) return failed(message, "Couldn't find that user");
    const problem = await clans.demoteCoLeader(message.guild, clan, target.id);
    return problem ? failed(message, problem) : done(message, `__Removed__ **${target.username}** __as a co-leader of__ **${clan.name}**`);
  },

  async tag(message, clan, rest) {
    const off = ['off', 'none', 'remove'].includes(rest[0].toLowerCase());
    const position = (rest[1] || 'prefix').toLowerCase();
    if (!off && !['prefix', 'suffix'].includes(position)) return failed(message, 'The position must be `prefix` or `suffix`');
    const result = await clans.setClanTag(message.guild, clan, off ? null : rest[0], off ? 'prefix' : position);
    if (typeof result === 'string') return failed(message, result);
    const note = result.failed ? ` (${result.failed} nickname${result.failed === 1 ? '' : 's'} could not be changed)` : '';
    return done(message, off ? `__Removed the tag of__ **${clan.name}**${note}` : `__Tag of__ **${clan.name}** __is now__ \`[${rest[0]}]\` __as a ${position}__${note}`);
  },

  async color(message, clan, rest) {
    const problem = await clans.setClanColor(message.guild, clan, rest[0]);
    return problem ? failed(message, problem) : done(message, `__Colour of__ **${clan.name}** __is now__ \`#${rest[0].replace(/^#/, '').toLowerCase()}\``);
  },

  async avatar(message, clan, rest) {
    const off = ['off', 'none', 'remove'].includes(rest[0].toLowerCase());
    const problem = await clans.setClanAvatar(message.guild, clan, off ? null : rest[0]);
    return problem ? failed(message, problem) : done(message, off ? `__Removed the avatar of__ **${clan.name}**` : `__Avatar of__ **${clan.name}** __updated__`);
  },

  async clanrole(message, clan, rest) {
    const role = resolveRole(message, rest.join(' '));
    if (!role) return failed(message, "Couldn't find that role");
    const hierarchy = checkRoleTarget(message, role);
    if (!hierarchy.ok) return clans.rejectRole(message, role, hierarchy.reason);
    const problem = await clans.setClanRole(message.guild, clan, role);
    return problem ? clans.rejectRole(message, role, problem) : done(message, `__Role of__ **${clan.name}** __is now__ ${role}`);
  },
};

module.exports = {
  name: 'clanupdate',
  aliases: [],
  description: 'Update clan properties',
  usage: '<clanID> name <newName>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (args.length < 2) return card(message, { title: TITLE, lines: USAGE_LINES });
    if (!(await clans.requireManager(message))) return;

    const clan = await clans.getClan(message.guild.id, clans.parseClanId(args[0]));
    if (!clan) return notice(message, '__Invalid clan ID__');

    const handler = Object.hasOwn(SUBCOMMANDS, args[1].toLowerCase()) ? SUBCOMMANDS[args[1].toLowerCase()] : null;
    const rest = args.slice(2);
    if (!handler || !rest.length) return card(message, { title: TITLE, lines: USAGE_LINES });
    return handler(message, clan, rest);
  },
};
