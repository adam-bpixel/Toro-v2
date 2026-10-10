'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { COMPONENTS_V2 } = require('../../utils/render/embeds');
const { isOwner, getSubscription } = require('../../models/economy/premium');
const { subscriptionStatus, subscriptionLines, subscriptionBlock, subscriptionCard } = require('../../utils/render/subscriptionCard');

const EPHEMERAL = 1 << 6;
const PANEL_BUTTON_ID = 'setup_subscription_1398395532103254157';

const isSubscriptionSetupInteraction = (interaction) => interaction.isMessageComponent() && interaction.customId === PANEL_BUTTON_ID;

async function handleSubscriptionSetupInteraction(interaction) {
  if (!interaction.inGuild() || !interaction.guild) return;
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      flags: COMPONENTS_V2 | EPHEMERAL,
      components: [{
        type: 17,
        components: [{ type: 10, content: '## Notice' }, { type: 14, spacing: 1, divider: true }, { type: 10, content: '- __You need the Administrator permission to view this__' }],
        spoiler: false,
      }],
    });
  }

  const owner = isOwner(interaction.user.id);
  const [userSub, serverSub, guild] = await Promise.all([
    getSubscription('user', interaction.user.id),
    getSubscription('server', interaction.guild.id),
    interaction.guild.fetch().catch(() => interaction.guild),
  ]);

  const userLines = [`- __Status__  ${subscriptionStatus(userSub, { owner })}`, ...subscriptionLines(userSub, { owner })];
  const serverLines = [`- __Status__  ${subscriptionStatus(serverSub)}`, ...subscriptionLines(serverSub)];
  const serverImage = guild.iconURL({ extension: 'png', size: 512 }) || interaction.client.user.displayAvatarURL({ extension: 'png', size: 512 });

  const card = subscriptionCard([
    subscriptionBlock('User Subscription Stats', interaction.user.displayAvatarURL({ extension: 'png', size: 512 }), userLines),
    subscriptionBlock('Server Subscription Stats', serverImage, serverLines),
  ]);
  return interaction.reply({ ...card, flags: COMPONENTS_V2 | EPHEMERAL });
}

module.exports = { isSubscriptionSetupInteraction, handleSubscriptionSetupInteraction };
