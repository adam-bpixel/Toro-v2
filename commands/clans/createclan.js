const { PermissionFlagsBits } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { card, notice } = require('../../utils/render/embeds');
const clans = require('../../models/economy/clans');

const COOLDOWN_MS = 30 * 60 * 1000;

module.exports = {
  name: 'createclan',
  aliases: [],
  description: 'Create a new clan',
  usage: '<@user|userID|username> <name>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (args.length < 2) {
      return card(message, {
        title: 'Create Clan Command',
        lines: [
          '__`&createclan <@user|userID|username> <name>`__',
          `__Name must be ${clans.NAME_MIN}-${clans.NAME_MAX} characters__`,
          '__Cooldown 30 minutes__',
        ],
      });
    }
    if (!(await clans.requireManager(message))) return;
    const { guild } = message;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    if (target.bot) return notice(message, "__A bot can't lead a clan__");
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");

    const name = args.slice(1).join(' ').trim();
    const nameProblem = await clans.validateName(guild.id, name);
    if (nameProblem) return notice(message, `__${nameProblem}__`);
    if (await clans.getClanOf(guild.id, member.id)) {
      return notice(message, `__**${member.user.username}** is already in a clan__`);
    }
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return notice(message, '__I need the Manage Roles permission to make the clan role__');
    }
    const cooldownKey = `createclan:${guild.id}:${message.author.id}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;

    const role = await guild.roles.create({ name, reason: `Clan created by ${message.author.username}` }).catch(() => null);
    if (!role) return notice(message, "__Couldn't create the clan role__");

    let clan;
    try {
      clan = await clans.createClan(guild, { name, leaderId: member.id, roleId: role.id });
    } catch (error) {
      await role.delete('Clan creation failed').catch(() => {});
      throw error;
    }
    clans.startCooldown(cooldownKey);

    return card(message, {
      title: 'Create Clan Command',
      lines: [
        `__Created clan__ **${clan.name}**`,
        `__ID__ : \`${clan.clanId}\``,
        `__Leader__ : ${member}`,
        `__Role__ : ${role}`,
        ...(clan.voiceChannelId ? [`__Voice Channel__ : <#${clan.voiceChannelId}>`] : ['__No voice channel was made - set a category with `&set-voiceclans` so the clan can earn hours__']),
      ],
    });
  },
};
