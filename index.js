require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Options, Partials } = require('discord.js');
const db = require('./models/core/db');
const loader = require('./utils/runtime/loader');
const { registerInviteTracker } = require('./handlers/security/inviteTracker');
const { registerLogs } = require('./handlers/security/logs');
const { registerProtection } = require('./handlers/security/protection');
const slashRuntime = require('./handlers/slashRuntime');
const { registerTempVoice } = require('./handlers/voice/tempvoice');
const { registerSnipe } = require('./models/enforcement/modTools');
const { installTheme, loadThemes } = require('./models/settings/theme');
const workmode = require('./models/core/workmode');
const blacklist = require('./models/core/blacklist');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
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
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  rest: { timeout: 30_000 },
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 50,
    PresenceManager: 200,
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
loader.loadCommands(client);
client.slashCommands = new Collection(loader.loadSlashCommands());

installTheme();

loader.loadEvents(client);

module.exports = { client };

if (require.main === module) {
  if (!process.env.DISCORD_TOKEN) {
    console.error('Set DISCORD_TOKEN in a .env file first (copy .env.example).');
    process.exit(1);
  }
  db.connect()
    .then(() => loadThemes().catch((error) => console.error('Could not load the server themes:', error.message)))
    .then(() => workmode.ensureLoaded().catch((error) => console.error('Could not load work mode:', error.message)))
    .then(() => blacklist.ensureLoaded().catch((error) => console.error('Could not load the blacklist:', error.message)))
    .then(() => client.login(process.env.DISCORD_TOKEN))
    .catch((error) => {
      console.error('Failed to connect to MongoDB (check MONGODB_URI in .env):', error);
      process.exit(1);
    });
}
