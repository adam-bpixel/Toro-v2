const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, patchTicketConfig, patchApplyConfig } = require('../../models/core/moderation');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const { buildTicketPanel } = require('../../handlers/ticketPanel');
const { sendApplyPanel } = require('../../handlers/apply/applyUI');
const roleRequest = require('../../handlers/roles/roleRequest');

const TEXT_CHANNELS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];
const SEND_FAILED = "I couldn't post the panel - check my permissions in that channel";

const TYPES = {
  ticket: {
    label: 'Ticket',
    aliases: ['tickets'],
    async send(guild, channel, config) {
      if (!config.ticketCategoryId) return 'The ticket system is not configured yet - use `&setup` -> Ticket first';
      const sent = await channel.send(buildTicketPanel(guild, config.ticketPanelStyle || 'button', config.ticketPanelImageURL, config.customTicketCategories)).catch(() => null);
      if (!sent) return SEND_FAILED;
      await disablePanelMessage(guild, config.ticketPanelChannelId, config.ticketPanelMessageId);
      await patchTicketConfig(guild.id, { panelChannelId: channel.id, panelMessageId: sent.id });
      return null;
    },
  },
  apply: {
    label: 'Apply',
    aliases: ['staffapply'],
    async send(guild, channel, config) {
      if (!config.applyReviewChannelId) return 'Staff Apply is not configured yet - use `&setup` -> Staff Apply first';
      const sent = await sendApplyPanel(channel, guild, config.applyPanelStyle || 'button', config.applyPanelImageURL).catch(() => null);
      if (!sent) return SEND_FAILED;
      await disablePanelMessage(guild, config.applyPanelChannelId, config.applyPanelMessageId);
      await patchApplyConfig(guild.id, { panelChannelId: channel.id, panelMessageId: sent.id });
      return null;
    },
  },
  rrequest: {
    label: 'Role Request',
    aliases: ['rr', 'rolerequest'],
    send: (guild, channel) => roleRequest.sendPanel(guild, channel),
  },
};

const resolveType = (key) => Object.values(TYPES).find((t) => t === TYPES[key] || t.aliases.includes(key)) || null;

module.exports = {
  name: 'sendpanel',
  aliases: [],
  description: 'Send (or resend) a panel - ticket, apply, rrequest',
  usage: '<ticket|apply|rrequest> [#channel]',
  category: 'Setup Commands',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, "__You don't have permission__");
    }
    const type = resolveType((args[0] || '').toLowerCase());
    if (!type) {
      return usageCard(message, {
        summary: 'Send or resend a panel - the previous one is turned off automatically',
        usage: '&sendpanel <ticket|apply|rrequest> [#channel]',
        notes: ['`ticket` : the ticket panel', '`apply` : the staff application panel', '`rrequest` : the role request panel'],
      });
    }
    const { guild } = message;

    const wanted = args[1] && (message.mentions.channels.first() || guild.channels.cache.get(args[1].replace(/[<#>]/g, '')));
    const channel = wanted || message.channel;
    if (!TEXT_CHANNELS.includes(channel.type)) return notice(message, '__Please pick a text channel__');

    const problem = await type.send(guild, channel, await getGuildConfig(guild.id));
    if (problem) return notice(message, `__${problem}__`);
    return card(message, {
      title: 'Send Panel',
      lines: [`__${type.label} panel sent to__ ${channel}`],
    });
  },
};
