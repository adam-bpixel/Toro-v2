const { ComponentType } = require('discord.js');
const { resolveUser } = require('../../utils/access/resolve');
const { container, notice, usageCard, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');
const activeComponents = require('../../utils/runtime/activeComponents');
const clans = require('../../models/economy/clans');

const COOLDOWN_MS = 10000;
const INVITE_TTL_MS = 60 * 1000;
const YES = 'clanjoin_yes';
const NO = 'clanjoin_no';

const joinLocks = new Set();

function inviteCard({ targetId, clanName, inviter, status }) {
  const lines = {
    pending: [`__Dear__ <@${targetId}>, __do you want to join__ **${clanName}**?`, `__Invited by__ **${inviter}**`, '__You have 1 minute to answer__'],
    accepted: [`${EMOJI.success} <@${targetId}> __accepted and joined__ **${clanName}**`],
    declined: [`<@${targetId}> __declined the invitation to__ **${clanName}**`],
    expired: [`__The invitation of__ <@${targetId}> __to__ **${clanName}** __has expired__`],
  }[status];
  const buttons = {
    type: 1,
    components: [
      { type: 2, style: 3, custom_id: YES, label: 'Yes', emoji: parseEmoji(EMOJI.success) },
      { type: 2, style: 4, custom_id: NO, label: 'No' },
    ],
  };
  return {
    flags: COMPONENTS_V2,
    components: [container({ title: 'Clan Invitation', lines, extraRows: status === 'pending' ? [buttons] : [] })],
    allowedMentions: { parse: [], users: status === 'pending' ? [targetId] : [] },
  };
}

module.exports = {
  name: 'adduser',
  aliases: ['addclan', 'add'],
  description: 'Invite a user to your clan',
  usage: '<ID|@member|username>',
  category: 'Clans Commands',
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Invite a user to your clan - they have to accept',
        usage: '&adduser <ID|@member|username>',
        notes: ['Cooldown: 10 seconds'],
      });
    }
    const clan = await clans.requireClanRank(message);
    if (!clan) return;
    const { guild } = message;

    const target = await resolveUser(message, args, { fallbackToAuthor: false });
    if (!target) return notice(message, "__Couldn't find that user__");
    if (target.id === message.author.id) return notice(message, "__You can't invite yourself__");
    if (target.bot) return notice(message, "__Bots can't join a clan__");
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) return notice(message, "__That user isn't in this server__");
    if (await clans.getClanOf(guild.id, member.id)) return notice(message, `__**${member.user.username}** is already in a clan__`);
    if (clan.memberIds.length >= clan.memberLimit) return notice(message, `__The clan is full (${clan.memberLimit}/${clan.memberLimit})__`);

    const cooldownKey = `adduser:${guild.id}:${message.author.id}`;
    if (await clans.tooSoon(message, cooldownKey, COOLDOWN_MS)) return;
    clans.startCooldown(cooldownKey);

    const inviter = message.member.displayName || message.author.username;
    const state = { targetId: member.id, clanName: clan.name, inviter };
    const sent = await message.channel.send(inviteCard({ ...state, status: 'pending' }));

    activeComponents.claim(sent.id);
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, time: INVITE_TTL_MS });
    let answered = false;
    const settle = (interaction, status) => {
      answered = true;
      collector.stop(status);
      return interaction.update(inviteCard({ ...state, status }));
    };

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== member.id) {
        return interaction
          .reply({ flags: (1 << 6) | COMPONENTS_V2, components: [container({ title: 'Notice', lines: ["__This invitation isn't for you__"] })] })
          .catch(() => {});
      }
      if (interaction.customId === NO) return settle(interaction, 'declined');
      if (joinLocks.has(member.id)) return interaction.deferUpdate().catch(() => {});

      joinLocks.add(member.id);
      try {
        const fresh = await clans.getClan(guild.id, clan.clanId);
        if (!fresh) return settle(interaction, 'expired');
        const problem = await clans.addMember(guild, fresh, member.id);
        return settle(interaction, problem ? 'declined' : 'accepted');
      } finally {
        joinLocks.delete(member.id);
      }
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      if (!answered) await sent.edit(inviteCard({ ...state, status: 'expired' })).catch(() => {});
    });
  },
};
