'use strict';
const { Events } = require('discord.js');
const economy = require('../models/economy/economy');
const guildStats = require('../models/activity/guildStats');
const { getAfk, clearAfk } = require('../models/activity/afk');
const { giveLevelRoles } = require('../handlers/roles/levelRoles');
const globalLogs = require('../handlers/security/globalLogs');
const { resolve: resolveAlias } = require('../models/settings/aliases');
const { trackCommand } = require('../handlers/security/logs');
const noPrefix = require('../models/enforcement/noprefix');
const { notice } = require('../utils/render/embeds');
const { getGuildConfig, isCommandRestricted } = require('../models/core/moderation');
const { isBareBotMention, prefixPayload, prefixesFor, matchPrefix } = require('../models/settings/prefix');
const { isOwner } = require('../models/economy/premium');
const workmode = require('../models/core/workmode');
const blacklist = require('../models/core/blacklist');
const { lacksPermission } = require('../utils/access/gate');
const { checkHoneypot } = require('../handlers/setup/honeypotSetup');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;
    if (workmode.isWorkMode() && !isOwner(message.author.id)) return;
    if (message.guild && await checkHoneypot(message).catch(() => false)) return;
    const { server: serverPrefix, personal: personalPrefix } = await prefixesFor(message.guild?.id, message.author.id);
    if (!message.reference && isBareBotMention(message.content, client.user.id)) {
      message.reply({ ...prefixPayload(serverPrefix, personalPrefix), allowedMentions: { repliedUser: false } }).catch(() => {});
    }
    let prefix = matchPrefix(message.content, personalPrefix ? [personalPrefix] : [serverPrefix]);
    if (!prefix && message.guild) {
      const named = noPrefix.resolveCommand(client, message.content.trim().split(/\s+/)[0]);
      if (named && (await noPrefix.allowed(message.guild.id, message.author.id, named).catch(() => false))) prefix = '';
      else if (noPrefix.isBuiltin(client, message.content)) prefix = '';
    }
    if (prefix === null) {
      if (message.guild) {
        economy.incrementMessageCount(message.author.id).catch(() => {});
        guildStats.addMessage(message.guild.id, message.author.id).catch(() => {});
        economy.grantMessageXp(message.author.id)
          .then((xp) => (xp && xp.leveledUp && message.member ? giveLevelRoles(message.member, xp.level) : null))
          .catch(() => {});

        const wasAfk = clearAfk(message.author.id);
        if (wasAfk) {
          message.reply({
            content: `- __Welcome back **${message.author.username}**! You were AFK <t:${Math.floor(wasAfk.since / 1000)}:R>__  ⁘`,
            allowedMentions: { repliedUser: false },
          }).catch(() => {});
        }
        for (const user of message.mentions.users.values()) {
          const afk = getAfk(user.id);
          if (afk) {
            message.reply({
              content: `- __${user.username} is AFK : ${afk.reason}__  ⁘`,
              allowedMentions: { repliedUser: false },
            }).catch(() => {});
          }
        }
      }
      return;
    }
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const name = (args.shift() || '').toLowerCase();
    let command = client.commands.get(name) || client.commands.get(client.aliases.get(name));
    if (!command) {
      const target = await resolveAlias(message.guild?.id, message.author.id, name).catch(() => null);
      command = target && client.commands.get(target);
    }
    if (!command) return;
    if (blacklist.isBlacklisted(message.author.id) && !isOwner(message.author.id)) return;
    if (!message.guild && !command.dmAllowed && !isOwner(message.author.id)) return;
    if (message.guild) {
      const config = await getGuildConfig(message.guild.id);
      if (isCommandRestricted(config, command.name, message.channel.id)) return;
    }
    if (lacksPermission(message, command)) {
      await notice(message, "__You don't have permission__").catch(() => {});
      return;
    }
    if (name !== command.name) message.invokedAs = { from: command.name, to: name };
    economy.incrementCommandCount(message.author.id).catch(() => {});
    if (message.guild) trackCommand(message.guild.id, message.author.id, `${prefix}${command.name}`);
    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`Command "${name}" failed:`, error);
      const isTimeout = error?.name === 'AbortError';
      await notice(
        message,
        isTimeout
          ? '__That took too long to reach Discord - please try again__'
          : '__Something went wrong running that command__',
      ).catch(() => {});
    }
    globalLogs.logCommand(message, command, `${prefix}${name}${args.length ? ` ${args.join(' ')}` : ''}`);
  },
};
