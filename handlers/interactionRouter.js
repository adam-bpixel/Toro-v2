'use strict';
const { MessageFlags } = require('discord.js');
const { handleComponent, touchIdle } = require('../utils/runtime/replay');
const activeComponents = require('../utils/runtime/activeComponents');
const tickets = require('./tickets');
const voice = require('./voice');
const claimroles = require('./claimroles');
const apply = require('./apply');
const roles = require('./roles');
const security = require('./security');
const setup = require('./setup');
const workmode = require('../models/core/workmode');
const blacklist = require('../models/core/blacklist');
const { isOwner } = require('../models/economy/premium');

const exactHandlers = new Map([
  [tickets.SETUP_BUTTON_ID, (i) => tickets.openTicketConfigPanel(i)],
  [tickets.SETUP_MODAL_ID, (i) => tickets.handleTicketSetupModalSubmit(i)],
  [apply.APPLY_BUTTON_ID, (i) => apply.openApplyConfigPanel(i)],
  [apply.APPLY_MODAL_ID, (i) => apply.handleApplySetupModalSubmit(i)],
]);

const featureCheckers = [
  { match: (i) => i.isModalSubmit() && i.customId.startsWith(apply.APPLY_FORM_PREFIX), handle: (i) => apply.handleApplicationSubmit(i) },
  { match: (i) => i.isButton() && apply.isApplyDecision(i.customId), handle: (i) => apply.handleApplyDecision(i) },
  { match: (i) => (i.isButton() || i.isStringSelectMenu()) && apply.isApplyComponent(i.customId), handle: (i) => apply.handleApplyInteraction(i) },
  { match: (i) => (i.isButton() || i.isStringSelectMenu()) && (i.customId.startsWith('ticket_') || i.customId === 'close_ticket'), handle: (i) => tickets.handleTicketInteraction(i) },
  { match: claimroles.isClaimrolesInteraction, handle: (i) => claimroles.handleClaimrolesInteraction(i) },
  { match: setup.isClanManagerSetupInteraction, handle: (i) => setup.handleClanManagerSetupInteraction(i) },
  { match: setup.isNoPrefixSetupInteraction, handle: (i) => setup.handleNoPrefixSetupInteraction(i) },
  { match: setup.isAutoreplyInteraction, handle: (i) => setup.handleAutoreplyInteraction(i) },
  { match: roles.isAutoroleInteraction, handle: (i) => roles.handleAutoroleInteraction(i) },
  { match: roles.isAutotagInteraction, handle: (i) => roles.handleAutotagInteraction(i) },
  { match: setup.isAliasesSetupInteraction, handle: (i) => setup.handleAliasesSetupInteraction(i) },
  { match: roles.isRolesSetupInteraction, handle: (i) => roles.handleRolesSetupInteraction(i) },
  { match: voice.isTempVoiceSetupInteraction, handle: (i) => voice.handleTempVoiceSetupInteraction(i) },
  { match: security.isLogsSetupInteraction, handle: (i, client) => security.handleLogsSetupInteraction(i, client.commands) },
  { match: roles.isLevelRolesInteraction, handle: (i) => roles.handleLevelRolesInteraction(i) },
  { match: roles.isRoleGroupsInteraction, handle: (i) => roles.handleRoleGroupsInteraction(i) },
  { match: setup.isClearSetupInteraction, handle: (i) => setup.handleClearSetupInteraction(i) },
  { match: setup.isCounterSetupInteraction, handle: (i) => setup.handleCounterSetupInteraction(i) },
  { match: setup.isPrefixSetupInteraction, handle: (i) => setup.handlePrefixSetupInteraction(i) },
  { match: setup.isCommandManageInteraction, handle: (i) => setup.handleCommandManageInteraction(i) },
  { match: setup.isSubscriptionSetupInteraction, handle: (i) => setup.handleSubscriptionSetupInteraction(i) },
  { match: setup.isThemeSetupInteraction, handle: (i) => setup.handleThemeSetupInteraction(i) },
  { match: setup.isAzkarSetupInteraction, handle: (i) => setup.handleAzkarSetupInteraction(i) },
  { match: setup.isWelcomerSetupInteraction, handle: (i) => setup.handleWelcomerSetupInteraction(i) },
  { match: setup.isBoostSetupInteraction, handle: (i) => setup.handleBoostSetupInteraction(i) },
  { match: setup.isHoneypotSetupInteraction, handle: (i) => setup.handleHoneypotSetupInteraction(i) },
  { match: roles.isRoleRequestInteraction, handle: (i) => roles.handleRoleRequestInteraction(i) },
  { match: setup.isSupportInteraction, handle: (i) => setup.handleSupportInteraction(i) },
  { match: setup.isSuggestInteraction, handle: (i) => setup.handleSuggestInteraction(i) },
  { match: voice.isVoiceMasterInteraction, handle: (i) => voice.handleVoiceMasterInteraction(i) },
];

async function handleChatInput(interaction, client) {
  if (blacklist.isBlacklisted(interaction.user.id) && !isOwner(interaction.user.id)) return;
  const slash = client.slashCommands.get(interaction.commandName);
  if (interaction.guildId) security.trackCommand(interaction.guildId, interaction.user.id, `/${interaction.commandName}`);
  try {
    if (slash) {
      await slash.execute(interaction);
    } else {
      await claimroles.notSetUp(interaction);
    }
  } catch (error) {
    console.error(`Slash command "${interaction.commandName}" failed:`, error);
    const failed = { content: '__Something went wrong running that command__', flags: MessageFlags.Ephemeral };
    await (interaction.replied || interaction.deferred ? interaction.followUp(failed) : interaction.reply(failed)).catch(() => {});
  }
}

async function handleInteraction(interaction, client) {
  if (workmode.isWorkMode() && !isOwner(interaction.user.id)) return;

  if (interaction.isChatInputCommand()) {
    return handleChatInput(interaction, client);
  }

  touchIdle(interaction);

  if (interaction.customId && exactHandlers.has(interaction.customId)) {
    try {
      await exactHandlers.get(interaction.customId)(interaction, client);
      return;
    } catch (error) {
      console.error(`Exact interaction "${interaction.customId}" failed:`, error);
      const failed = { content: '__Something went wrong__', flags: MessageFlags.Ephemeral };
      await (interaction.replied || interaction.deferred ? interaction.followUp(failed) : interaction.reply(failed)).catch(() => {});
      return;
    }
  }

  for (const checker of featureCheckers) {
    if (checker.match(interaction)) {
      try {
        await checker.handle(interaction, client);
      } catch (error) {
        console.error('Interaction execution error:', error);
        const failed = { content: '__Something went wrong__', flags: MessageFlags.Ephemeral };
        await (interaction.replied || interaction.deferred ? interaction.followUp(failed) : interaction.reply(failed)).catch(() => {});
      }
      return;
    }
  }

  if (!interaction.isMessageComponent()) return;
  if (activeComponents.has(interaction.message?.id)) return;

  try {
    await handleComponent(interaction, client.commands);
  } catch (error) {
    console.error('Component interaction failed:', error);
  }
}

module.exports = { handleInteraction };
