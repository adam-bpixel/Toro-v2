const { textBlock, divider, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { EMOJI, LEADERBOARD_EMOJI: L } = require('../../utils/emojis');
const { comma } = require('../../utils/format');
const { resolveUser } = require('../../utils/access/resolve');
const { getUser, levelFromTotalXp, getRank } = require('../../models/economy/economy');

const digits = (n) => [...String(n)].map((d) => (d === '0' ? L.zero : L.ranks[d])).join('');
const line = (label, value) => textBlock(`- __${label}__ : ${value}  ⁘`);

module.exports = {
  name: 'data',
  aliases: [],
  description: "View your data (level, XP, RVP, activity)",
  usage: '[ID|@member|username]',
  category: 'Rvp System',
  async execute(message, args) {
    const target = await resolveUser(message, args);
    const user = await getUser(target.id);
    const rank = await getRank(target.id);
    const { level, levelXp, xpNeeded } = levelFromTotalXp(user.totalXp);
    const lastDaily = user.lastDaily ? `<t:${Math.floor(new Date(user.lastDaily).getTime() / 1000)}:R>` : 'Never';

    return message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          {
            type: 9,
            components: [textBlock(`## ${target.displayName || target.username}'s Data`)],
            accessory: { type: 11, media: { url: target.displayAvatarURL({ extension: 'png', size: 256 }) }, description: null, spoiler: false },
          },
          divider(),
          textBlock(`- __User ID__ : \`${target.id}\`  ⁘`),
          textBlock(`- __Global Rank__ : ${digits(rank)}  ⁘`),
          divider(),
          line('Level', `${comma(level)}`),
          line('Total XP', `${comma(user.totalXp)}`),
          line('Current Level XP', `${comma(levelXp)}`),
          line('XP Needed', `${comma(xpNeeded)}`),
          divider(),
          textBlock(`- __RVP__ : ${comma(user.balance)} ${EMOJI.coin}  ⁘`),
          line('Total Commands', `${comma(user.commandCount || 0)}`),
          line('Voice Hours', `${((user.voiceMs || 0) / 3600000).toFixed(2)}h`),
          divider(),
          line('Daily Streak', `${user.dailyStreak || 0} day${user.dailyStreak === 1 ? '' : 's'}`),
          textBlock(`- __Last Daily__ : ${lastDaily}  ⁘`),
          divider(),
          line('Background', 'Default'),
          line('XP Boost', 'None'),
          divider(),
        ],
        spoiler: false,
      }],
      allowedMentions: { repliedUser: true, parse: [] },
    });
  },
};
