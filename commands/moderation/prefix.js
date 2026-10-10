const { PermissionFlagsBits } = require('discord.js');
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider, bullet, card, notice } = require('../../utils/render/embeds');
const { prefixesFor, savePrefix, savePersonalPrefix } = require('../../models/settings/prefix');
const cooldown = require('../../utils/runtime/cooldown');
const { canUsePersonalPrefix } = require('../../models/economy/premium');

const MAX_PREFIX_LENGTH = 5;
const COOLDOWN_MS = 30_000;

function helpPanel(prefix, personal) {
  const current = [bullet(`__Server Prefix: \`${prefix}\`__`), ...(personal ? [bullet(`__Personal Prefix: \`${personal}\`__`)] : [])];
  const usage = [
    '**Server Prefix:**',
    bullet(`__\`${prefix}prefix <new_prefix>\`__`),
    bullet('__Cooldown: 30 seconds__'),
    '',
    '**Personal Prefixes:**',
    bullet(`__\`${prefix}prefix self\`__`),
    bullet('__Premium users only__'),
  ].join('\n');

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock('## Command'),
        divider(),
        textBlock(bullet('__Manage server and personal prefixes__')),
        divider(),
        textBlock('## Current Prefixes'),
        divider(),
        textBlock(current.join('\n')),
        divider(),
        textBlock('## Usage'),
        divider(),
        textBlock(usage),
      ],
      spoiler: false,
    }],
  };
}

const badPrefix = (args) => args.length !== 1 || [...args[0]].length > MAX_PREFIX_LENGTH || args[0].includes('`');
const BAD_PREFIX_NOTICE = `__The prefix must be 1 to ${MAX_PREFIX_LENGTH} characters, without spaces or backticks__`;

async function personalPrefix(message, args, server, current) {
  if (!(await canUsePersonalPrefix(message.author.id))) return notice(message, '__Personal prefixes are for Premium users only__');
  if (!args.length) {
    return card(message, {
      title: 'Personal Prefix',
      lines: [
        current ? `__Your prefix__ : \`${current}\`` : "__You don't have a personal prefix__",
        `__\`${server}prefix self <new_prefix>\`__`,
        `__\`${server}prefix self reset\`__`,
      ],
    });
  }

  if (args.length === 1 && args[0].toLowerCase() === 'reset') {
    if (!current) return notice(message, "__You don't have a personal prefix__");
    await savePersonalPrefix(message.author.id, null);
    return card(message, { title: 'Personal Prefix', lines: ['__Your personal prefix was removed__'] });
  }

  if (badPrefix(args)) return notice(message, BAD_PREFIX_NOTICE);
  const next = args[0];
  if (next === current) return notice(message, '__That is already your personal prefix__');

  await savePersonalPrefix(message.author.id, next);
  await card(message, {
    title: 'Personal Prefix',
    lines: [`__Your personal prefix is now__ \`${next}\``, '__Only you can use it, next to the server prefix__'],
  });
}

module.exports = {
  name: 'prefix',
  aliases: [],
  description: 'Manage server and personal prefixes',
  usage: '[new_prefix|self]',
  category: 'Moderation Commands',
  async execute(message, args) {
    const { server, personal } = await prefixesFor(message.guild?.id, message.author.id);
    const first = (args[0] || '').toLowerCase();

    if (first === 'self') return personalPrefix(message, args.slice(1), server, personal);

    if (!message.guild) return notice(message, '__This command can only be used in a server__');
    if (!args.length) return message.reply({ ...helpPanel(server, personal), allowedMentions: { repliedUser: true } });

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return notice(message, '__You need the Administrator permission to change the server prefix__');
    }
    if (badPrefix(args)) return notice(message, BAD_PREFIX_NOTICE);
    const next = args[0];
    if (next === server) return notice(message, '__That is already the server prefix__');

    const wait = cooldown.hit(`prefix:${message.guild.id}`, COOLDOWN_MS);
    if (wait.onCooldown) {
      const seconds = Math.ceil(wait.remainingMs / 1000);
      return notice(message, `__Please wait ${seconds} second${seconds === 1 ? '' : 's'} before changing the prefix again__`);
    }

    await savePrefix(message.guild.id, next);
    await card(message, { title: 'Prefix', lines: [`__Server prefix changed to__ \`${next}\``] });
  },
};
