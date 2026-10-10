const { card, notice } = require('../../utils/render/embeds');
const { duration } = require('../../utils/format');
const clans = require('../../models/economy/clans');

const SHOWN = 20;

const describe = (clan) => {
  const list = (ids) => (ids.length ? ids.map((id) => `<@${id}>`).join(' ') : '__None__');
  const hours = (id) => duration((clan.hoursMs || {})[id] || 0);
  const others = clan.memberIds.filter((id) => id !== clan.leaderId && !clan.coleaderIds.includes(id));
  const roster = [clan.leaderId, ...clan.coleaderIds, ...others];
  return [
    `__Name__ : **${clan.name}**`,
    `__ID__ : \`${clan.clanId}\``,
    `__Leader__ : <@${clan.leaderId}>`,
    `__Co-leaders__ ${clan.coleaderIds.length}/${clan.coleaderLimit} : ${list(clan.coleaderIds)}`,
    `__Members__ ${clan.memberIds.length}/${clan.memberLimit}`,
    `__Role__ : <@&${clan.roleId}>`,
    ...(clan.tag ? [`__Tag__ : \`[${clan.tag}]\` (${clan.tagPosition || 'prefix'})`] : []),
    `__Voice Channel__ : ${clan.voiceChannelId ? `<#${clan.voiceChannelId}>` : '__None__'}`,
    `__Total Voice Time__ : ${duration(clans.totalHoursMs(clan))}`,
    `__Warnings__ : ${clan.warnings || 0}`,
    ...roster.slice(0, SHOWN).map((id) => `<@${id}> - ${hours(id)}`),
    ...(roster.length > SHOWN ? [`__and ${roster.length - SHOWN} more__`] : []),
  ];
};

module.exports = {
  name: 'claninfo',
  aliases: ['clan'],
  description: 'View a clan, or list the clans of this server',
  usage: '[clanID]',
  category: 'Clans Commands',
  async execute(message, args) {
    const { guild } = message;

    if (args.length) {
      const clan = await clans.getClan(guild.id, clans.parseClanId(args[0]));
      if (!clan) return notice(message, '__Invalid clan ID__');
      return card(message, { title: 'Clan Info', lines: describe(clan) });
    }

    const own = await clans.getClanOf(guild.id, message.author.id);
    if (own) return card(message, { title: 'Clan Info', lines: describe(own) });

    const all = await clans.listClans(guild.id);
    if (!all.length) return notice(message, '__There are no clans in this server yet__');
    return card(message, {
      title: 'Clans',
      lines: [
        ...all.slice(0, 25).map((clan) => `\`${clan.clanId}\` **${clan.name}** - <@${clan.leaderId}> - ${clan.memberIds.length}/${clan.memberLimit}`),
        ...(all.length > 25 ? [`__and ${all.length - 25} more__`] : []),
        '__Use `&claninfo <clanID>` for details__',
      ],
    });
  },
};
