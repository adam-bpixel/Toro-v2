'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { MessageFlags } = require('discord.js');
const { handleComponent, touchIdle } = require('../utils/runtime/replay');
const activeComponents = require('../utils/runtime/activeComponents');
const claimroles = require('./claimroles');
const security = require('./security');
const workmode = require('../models/core/workmode');
const blacklist = require('../models/core/blacklist');
const { isOwner } = require('../models/economy/premium');

// Every handlers/<feature>/index.js may export `routes: [{ name, match, handle }]`. They are
// collected here, so a new panel only has to declare its route next to its own code.
function loadRoutes() {
  const routes = [];
  const names = new Set();
  for (const entry of fs.readdirSync(__dirname, { withFileTypes: true })) {
    const index = path.join(__dirname, entry.name, 'index.js');
    if (!entry.isDirectory() || !fs.existsSync(index)) continue;
    for (const route of require(index).routes || []) {
      if (typeof route.match !== 'function' || typeof route.handle !== 'function') {
        throw new Error(`Route "${route.name}" in handlers/${entry.name} needs a match and a handle function`);
      }
      if (names.has(route.name)) throw new Error(`Two interaction routes are named "${route.name}"`);
      names.add(route.name);
      routes.push(route);
    }
  }
  return routes;
}

const routes = loadRoutes();
const warnedOverlaps = new Set();

// Returns the route for this interaction. If more than one claims it, that is a bug (two
// features sharing a customId): the first still runs, but it is logged once per customId.
function findRoute(interaction) {
  const matched = routes.filter((route) => route.match(interaction));
  if (matched.length > 1 && !warnedOverlaps.has(interaction.customId)) {
    warnedOverlaps.add(interaction.customId);
    console.warn(`customId "${interaction.customId}" matches several routes (${matched.map((r) => r.name).join(', ')}); only "${matched[0].name}" runs`);
  }
  return matched[0];
}

async function replyFailed(interaction, content) {
  const failed = { content, flags: MessageFlags.Ephemeral };
  await (interaction.replied || interaction.deferred ? interaction.followUp(failed) : interaction.reply(failed)).catch(() => {});
}

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
    await replyFailed(interaction, '__Something went wrong running that command__');
  }
}

async function handleInteraction(interaction, client) {
  if (workmode.isWorkMode() && !isOwner(interaction.user.id)) return;

  if (interaction.isChatInputCommand()) {
    return handleChatInput(interaction, client);
  }

  touchIdle(interaction);

  const route = interaction.customId ? findRoute(interaction) : null;
  if (route) {
    try {
      await route.handle(interaction, client);
    } catch (error) {
      console.error(`Interaction route "${route.name}" failed on "${interaction.customId}":`, error);
      await replyFailed(interaction, '__Something went wrong__');
    }
    return;
  }

  if (!interaction.isMessageComponent()) return;
  if (activeComponents.has(interaction.message?.id)) return;
  if (interaction.customId === 'giveaway_enter') return;

  try {
    await handleComponent(interaction, client.commands);
  } catch (error) {
    console.error('Component interaction failed:', error);
  }
}

module.exports = { handleInteraction, routes };
