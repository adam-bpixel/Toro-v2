require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const slashDir = path.join(__dirname, 'slash');
const commands = [];
for (const category of fs.readdirSync(slashDir, { withFileTypes: true })) {
  if (!category.isDirectory()) continue;
  const categoryDir = path.join(slashDir, category.name);
  for (const file of fs.readdirSync(categoryDir).filter((f) => f.endsWith('.js'))) {
    commands.push(require(path.join(categoryDir, file)).data);
  }
}

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
