require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Options, Partials } = require('discord.js');
const db = require('./models/core/db');
const { registerInviteTracker } = require('./handlers/security/inviteTracker');
const { registerLogs } = require('./handlers/security/logs');
const { registerProtection } = require('./handlers/security/protection');
const slashRuntime = require('./handlers/slashRuntime');
const { registerTempVoice } = require('./handlers/voice/tempvoice');
const { registerSnipe } = require('./models/enforcement/modTools');
const { installTheme, loadThemes } = require('./models/settings/theme');
const workmode = require('./models/core/workmode');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.ThreadMember],
  rest: { timeout: 30_000 },
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 50,
    PresenceManager: 0,
    GuildMemberManager: 200,
    UserManager: 200,
    ThreadManager: 25,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    GuildInviteManager: 0,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: { interval: 600, lifetime: 1800 },
    users: { interval: 3600, filter: () => (user) => user.id !== user.client.user.id },
    guildMembers: {
      interval: 1800,
      filter: () => (member) => member.id !== member.client.user.id && !member.voice?.channelId,
    },
    threads: { interval: 3600, lifetime: 14400 },
  },
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

require('./utils/runtime/customButton').install();
registerLogs(client);
registerInviteTracker(client);
slashRuntime.register(client);
registerProtection(client);
registerTempVoice(client);
registerSnipe(client);
client.commands = new Collection();
client.aliases = new Collection();

const commandsDir = path.join(__dirname, 'commands');
for (const category of fs.readdirSync(commandsDir, { withFileTypes: true })) {
  if (!category.isDirectory()) continue;
  const categoryDir = path.join(commandsDir, category.name);
  for (const file of fs.readdirSync(categoryDir).filter((f) => f.endsWith('.js'))) {
    const command = require(path.join(categoryDir, file));
    if (typeof command.name !== 'string' || typeof command.execute !== 'function') continue;
    client.commands.set(command.name, command);
    for (const alias of command.aliases || []) client.aliases.set(alias, command.name);
  }
}

client.slashCommands = new Collection();
const slashDir = path.join(__dirname, 'slash');
for (const category of fs.readdirSync(slashDir, { withFileTypes: true })) {
  if (!category.isDirectory()) continue;
  const categoryDir = path.join(slashDir, category.name);
  for (const file of fs.readdirSync(categoryDir).filter((f) => f.endsWith('.js'))) {
    const slash = require(path.join(categoryDir, file));
    client.slashCommands.set(slash.name, slash);
  }
}

installTheme();

const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsDir, file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

module.exports = { client };

if (require.main === module) {
  if (!process.env.DISCORD_TOKEN) {
    console.error('Set DISCORD_TOKEN in a .env file first (copy .env.example).');
    process.exit(1);
  }
  db.connect()
    .then(() => loadThemes().catch((error) => console.error('Could not load the server themes:', error.message)))
    .then(() => workmode.ensureLoaded().catch((error) => console.error('Could not load work mode:', error.message)))
    .then(() => client.login(process.env.DISCORD_TOKEN))
    .catch((error) => {
      console.error('Failed to connect to MongoDB (check MONGODB_URI in .env):', error);
      process.exit(1);
    });
}
