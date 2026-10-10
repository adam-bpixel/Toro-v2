const { textBlock, divider, ACCENT_COLOR, COMPONENTS_V2, notice } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');
const { prefixFor } = require('../../models/settings/prefix');
const { duration } = require('../../utils/format');
const clans = require('../../models/economy/clans');

module.exports = {
  name: 'myclan',
  aliases: [],
  description: 'View your clan',
  usage: '',
  category: 'Clans Commands',
  async execute(message) {
    const { guild } = message;
    const clan = await clans.getClanOf(guild.id, message.author.id);
    if (!clan) return notice(message, '__You are not in a clan__');

    const coleaders = clan.coleaderIds.length ? clan.coleaderIds.map((id) => `<@${id}>`).join(', ') : 'None';
    const info = textBlock([
      `**Clan ID : ${clan.clanId}**`,
      `  ⟿ __Clan Leader__ : <@${clan.leaderId}>`,
      `  ⟿ __Co-Leaders__ : ${coleaders}`,
      `  ⟿ __Member Count__ : ${clan.memberIds.length}`,
      ...(clan.tag ? [`  ⟿ __Tag__ : [${clan.tag}]`] : []),
      `  ⟿ __Voice Channel__ : ${clan.voiceChannelId ? `<#${clan.voiceChannelId}>` : 'None'}`,
      `  ⟿ __Total Voice Time__ : ${duration(clans.totalHoursMs(clan))}`,
    ].join('\n'));

    const role = guild.roles.cache.get(clan.roleId);
    const iconUrl = clan.avatarUrl || role?.iconURL({ size: 256 });
    const details = iconUrl
      ? { type: 9, components: [info], accessory: { type: 11, media: { url: iconUrl }, description: role.name, spoiler: false } }
      : info;

    const prefix = await prefixFor(guild.id);
    return message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          textBlock(`## ${EMOJI.clan} ${clan.name} - Clan Information`),
          divider(),
          details,
          divider(),
          textBlock(`-# For more clan details, use \`${prefix}clan\``),
        ],
        spoiler: false,
      }],
      allowedMentions: { repliedUser: true },
    });
  },
};
