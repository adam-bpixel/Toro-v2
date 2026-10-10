const { ComponentType } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { card, notice, container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const activeComponents = require('../../utils/runtime/activeComponents');
const clans = require('../../models/economy/clans');

const COOLDOWN_MS = 10000;
const CONFIRM_TTL_MS = 60_000;

function promotionCard({ authorId, targetId, custom, lines, pending = false }) {
  const buttons = {
    type: 1,
    components: [
      { type: 2, style: 3, label: 'Confirm', custom_id: `clanaddcol_${authorId}_${targetId}_${custom}` },
      { type: 2, style: 2, label: 'Cancel', custom_id: `clanaddcolcancel_${authorId}_${targetId}_${custom}` },
    ],
  };
  return {
    flags: COMPONENTS_V2,
    components: [container({ title: 'Co-leader Promotion', lines, extraRows: pending ? [buttons] : [] })],
    allowedMentions: { parse: [] },
  };
}

module.exports = {
  name: 'addcoleader',
  aliases: [],
  description: 'Add a co-leader to your clan',
  usage: '<@user|userID|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'Clan Command',
        lines: [
          '__Add a co-leader to your clan__',
          '__Usage: `&addcoleader <@user|userID|username>`__',
          '__Cooldown 10 seconds__',
        ],
      });
    }
    const clan = await clans.requireClanRank(message, { leaderOnly: true });
    if (!clan) return;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");

    if (!clan.memberIds.includes(target.id)) return notice(message, "__That user isn't in this clan__");
    if (clan.leaderId === target.id) return notice(message, '__That user is the leader__');
    if (clan.coleaderIds.includes(target.id)) return notice(message, '__That user is already a co-leader__');

    const cooldownKey = `coleader:${message.guild.id}:${message.author.id}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;

    const ids = { authorId: message.author.id, targetId: target.id, custom: Math.floor(Math.random() * 90000) + 10000 };
    const question = `__<@${ids.authorId}>, are you sure you want to promote <@${ids.targetId}> to co-leader?__`;
    const sent = await message.channel.send(promotionCard({ ...ids, lines: [question], pending: true }));

    activeComponents.claim(sent.id);
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, time: CONFIRM_TTL_MS });
    let answered = false;
    const finish = (interaction, line) => {
      answered = true;
      collector.stop();
      return interaction.update(promotionCard({ ...ids, lines: [line] }));
    };

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== ids.authorId) {
        return interaction
          .reply({ flags: (1 << 6) | COMPONENTS_V2, components: [container({ title: 'Notice', lines: ["__This isn't for you__"] })] })
          .catch(() => {});
      }
      if (interaction.customId.startsWith('clanaddcolcancel_')) return finish(interaction, '__Promotion cancelled__');

      const fresh = await clans.getClan(message.guild.id, clan.clanId);
      const problem = fresh ? await clans.promoteCoLeader(message.guild, fresh, target.id) : 'That clan no longer exists';
      if (problem) return finish(interaction, `__${problem}__`);
      clans.startCooldown(cooldownKey);
      return finish(interaction, `__Added__ **${target.username}** __as a co-leader of__ **${clan.name}**`);
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      if (!answered) await sent.edit(promotionCard({ ...ids, lines: ['__The promotion request has expired__'] })).catch(() => {});
    });
  },
};
