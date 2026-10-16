'use strict';
const fs = require('node:fs');
const path = require('node:path');

// The one place that knows the commands/<category>/<name>.js, slash/<category>/<name>.js and
// events/<name>.js layout. index.js, &reload, deploy-commands.js and the tests all use it, so
// a clashing name or a file missing its exports is caught the same way everywhere.

const ROOT = path.join(__dirname, '..', '..');
const COMMANDS_DIR = path.join(ROOT, 'commands');
const SLASH_DIR = path.join(ROOT, 'slash');
const EVENTS_DIR = path.join(ROOT, 'events');

const jsFiles = (dir) => fs.readdirSync(dir).filter((file) => file.endsWith('.js')).map((file) => path.join(dir, file));

const categoryFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => jsFiles(path.join(dir, entry.name)));

const rel = (file) => path.relative(ROOT, file);

// Which file each prefix command name came from, so a reload of the same file is allowed but
// two files claiming one name is not.
const commandSources = new Map();

function addCommand(client, file) {
  const command = require(file);
  if (typeof command.name !== 'string' || typeof command.execute !== 'function') {
    throw new Error(`${rel(file)} must export a string "name" and an "execute" function`);
  }
  const owner = commandSources.get(command.name);
  if (owner && owner !== file) throw new Error(`Command "${command.name}" is defined in both ${rel(owner)} and ${rel(file)}`);

  // Drop the aliases an earlier version of this command registered, then add the current ones.
  for (const [alias, target] of client.aliases) if (target === command.name) client.aliases.delete(alias);
  for (const alias of command.aliases || []) {
    const taken = client.aliases.get(alias);
    if (taken && taken !== command.name) throw new Error(`Alias "${alias}" of ${rel(file)} already belongs to "${taken}"`);
    if (commandSources.has(alias) && alias !== command.name) throw new Error(`Alias "${alias}" of ${rel(file)} is already a command name`);
    client.aliases.set(alias, command.name);
  }
  commandSources.set(command.name, file);
  client.commands.set(command.name, command);
  return command;
}

function loadCommands(client) {
  for (const file of categoryFiles(COMMANDS_DIR)) addCommand(client, file);
  return client.commands;
}

function loadSlashCommands() {
  const slash = new Map();
  for (const file of categoryFiles(SLASH_DIR)) {
    const command = require(file);
    if (typeof command.name !== 'string' || !command.data || typeof command.execute !== 'function') {
      throw new Error(`${rel(file)} must export "name", "data" and an "execute" function`);
    }
    if (slash.has(command.name)) throw new Error(`Slash command "/${command.name}" is defined twice (${rel(file)})`);
    slash.set(command.name, command);
  }
  return slash;
}

function loadEvents(client) {
  for (const file of jsFiles(EVENTS_DIR)) {
    const event = require(file);
    if (typeof event.name !== 'string' || typeof event.execute !== 'function') {
      throw new Error(`${rel(file)} must export a string "name" and an "execute" function`);
    }
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
  }
}

module.exports = {
  COMMANDS_DIR,
  commandFiles: () => categoryFiles(COMMANDS_DIR),
  addCommand,
  loadCommands,
  loadSlashCommands,
  loadEvents,
};
