'use strict';
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider } = require('../../utils/render/embeds');
const { STATS_EMOJI, SERVER_EMOJI, OWNER_EMOJI, PING_EMOJI, TICKET_EMOJI } = require('../../utils/emojis');
const { defaultPrefix } = require('../../utils/defaultPrefix');

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!days && !hours) parts.push(`${secs}s`);
  return parts.join(' ') || '0s';
}

async function ownerMention(client) {
  const app = client.application.owner || await client.application.fetch().then((a) => a.owner).catch(() => null);
  if (!app) return 'Unknown';
  if (app.members) return [...app.members.values()].map((m) => `<@${m.user.id}>`).join(', ');
  return `<@${app.id}>`;
}

module.exports = {
  name: 'botinfo',
  aliases: ['bi', 'about'],
  description: 'Show information about the bot',
  usage: '',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args, client) {
    const owner = await ownerMention(client);
    const prefixCommands = client.commands.size;
    const slashCommands = client.slashCommands.size;
    const servers = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
    const uptime = formatUptime(client.uptime);
    const ping = Math.round(client.ws.ping);

    return message.reply({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          {
            type: 9,
            components: [textBlock(`## ${STATS_EMOJI.title} ${client.user.username} Bot Info`)],
            accessory: { type: 11, media: { url: client.user.displayAvatarURL({ size: 256 }) }, description: 'Bot Icon', spoiler: false },
          },
          divider(),
          textBlock([
            `${OWNER_EMOJI.servers} **Owner** ⟿ ${owner}`,
            `${SERVER_EMOJI.members} **Servers** ⟿ **\`${servers}\`**`,
            `${SERVER_EMOJI.members} **Users** ⟿ **\`${users}\`**`,
          ].join('\n\n')),
          divider(),
          textBlock([
            `**Prefix Commands** ⟿ **\`${prefixCommands}\`**`,
            `**Slash Commands** ⟿ **\`${slashCommands}\`**`,
            `**Default Prefix** ⟿ **\`${defaultPrefix()}\`**`,
          ].join('\n\n')),
          divider(),
          textBlock([
            `${PING_EMOJI.title} **Ping** ⟿ **\`${ping}ms\`**`,
            `**Uptime** ⟿ **\`${uptime}\`**`,
          ].join('\n\n')),
          divider(),
          textBlock(`-# ${TICKET_EMOJI.footer} ༯ Requested by ${message.author.username}`),
        ],
        spoiler: false,
      }],
      allowedMentions: { repliedUser: true, parse: [] },
    });
  },
};
