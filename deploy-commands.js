require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { loadSlashCommands } = require('./utils/runtime/loader');

const commands = [...loadSlashCommands().values()].map((slash) => slash.data);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  if (!process.env.DISCORD_TOKEN) {
    console.error('Set DISCORD_TOKEN in a .env file first.');
    process.exit(1);
  }
  try {
    const clientId = process.env.DISCORD_CLIENT_ID || (await rest.get(Routes.currentApplication())).id;
    console.log(`Refreshing ${commands.length} global application (/) commands for client ${clientId}...`);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`Done. Old commands were replaced; ${data.length} commands are now registered.`);
  } catch (error) {
    console.error('Failed to deploy commands:', error);
    process.exit(1);
  }
})();
