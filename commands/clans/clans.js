const { notice, divider, textBlock } = require('../../utils/render/embeds');
const { LEADERBOARD_EMOJI: L } = require('../../utils/emojis');
const { clanIcon, buildPage, sendPaged } = require('../../utils/render/clanBoard');
const clans = require('../../models/economy/clans');

const PREV = 'clanslist_prev';
const NEXT = 'clanslist_next';

const hours = (ms) => Math.floor(ms / 3600000);

function clanSection(guild, botIcon, clan) {
  const lines = [
    `**${clan.name}**`,
    `> -# **ID : \`${clan.clanId}\`**`,
    `> -# **Role :** <@&${clan.roleId}>`,
    `> -# **Hours : ${hours(clans.totalHoursMs(clan))} hours**`,
    `> -# **Members : ${clan.memberIds.length}/${clan.memberLimit}**`,
  ];
  return {
    type: 9,
    components: [textBlock(lines.join('\n'))],
    accessory: { type: 11, media: { url: clanIcon(guild, botIcon, clan) }, description: clan.name, spoiler: false },
  };
}

module.exports = {
  name: 'clans',
  aliases: [],
  description: 'List all clans in the server',
  usage: '',
  category: 'Clans Commands',
  async execute(message) {
    const { guild } = message;
    if (!(await clans.listClans(guild.id)).length) return notice(message, '__There are no clans in this server yet__');

    const botIcon = message.client.user.displayAvatarURL({ size: 256 });
    const head = [textBlock(`## ${L.title} ${guild.name} 〃Clans`), divider()];
    await sendPaged(message, {
      load: () => clans.listClans(guild.id),
      render: (list, page) => buildPage({ head, ranked: list, page, prevId: PREV, nextId: NEXT, section: (clan) => clanSection(guild, botIcon, clan) }),
      prevId: PREV,
      nextId: NEXT,
    });
  },
};
