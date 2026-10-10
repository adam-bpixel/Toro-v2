'use strict';
const { ChannelType } = require('discord.js');
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { getSuggestConfig, updateGuildConfig } = require('../../models/core/moderation');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const { buildSuggestPanel } = require('../../handlers/setup/suggestReport');

const TEXT_CHANNELS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

module.exports = {
  name: 'sendsuggest',
  aliases: [],
  description: 'Post the Feature Suggestions panel and set its review channel',
  usage: '<#panel channel> <#review channel>',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');
    const { guild } = message;
    if (!guild) return notice(message, '__This command only works in a server__');

    const resolve = (raw) => guild.channels.cache.get((raw || '').replace(/[<#>]/g, ''));
    const panelChannel = resolve(args[0]);
    const reviewChannel = resolve(args[1]);
    if (!panelChannel || !reviewChannel) {
      return usageCard(message, {
        summary: 'Post the Feature Suggestions panel and set which channel reviews the submissions',
        usage: '&sendsuggest <#panel channel> <#review channel>',
        notes: ['Mention both channels, or give their IDs'],
      });
    }
    if (!TEXT_CHANNELS.includes(panelChannel.type) || !TEXT_CHANNELS.includes(reviewChannel.type)) {
      return notice(message, '__Both channels must be text channels__');
    }

    const sent = await panelChannel.send(buildSuggestPanel(message.client.user.username)).catch(() => null);
    if (!sent) return notice(message, "__I couldn't post the panel - check my permissions in that channel__");

    const previous = await getSuggestConfig(guild.id);
    await disablePanelMessage(guild, previous.panelChannelId, previous.panelMessageId);
    await updateGuildConfig(guild.id, {
      $set: {
        'suggest.panelChannelId': panelChannel.id,
        'suggest.reviewChannelId': reviewChannel.id,
        'suggest.panelMessageId': sent.id,
      },
    });

    return card(message, {
      title: 'Feature Suggestions',
      lines: [`__Panel__ : ${panelChannel}`, `__Review Channel__ : ${reviewChannel}`],
    });
  },
};
