'use strict';
const { COMPONENTS_V2 } = require('../../utils/render/embeds');

const COLOR = { command: 0x5c9dff, slash: 0x8b7bff, button: 0x3fd67e, select: 0xffb347, modal: 0xff7ab8 };
const MAX_QUEUE = 300;

const clip = (value, max = 300) => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const time = () => `<t:${Math.floor(Date.now() / 1000)}:F> • <t:${Math.floor(Date.now() / 1000)}:R>`;
const text = (content) => ({ type: 10, content });
const divider = () => ({ type: 14, spacing: 1, divider: true });

function card({ kind, title, what, user, guild, channel, link }) {
  const where = guild
    ? [`- __Server__ : ${clip(guild.name, 80)} \`${guild.id}\``, channel ? `- __Channel__ : <#${channel.id}> \`${channel.id}\`` : null]
    : ['- __Server__ : `Direct messages`'];
  return {
    flags: COMPONENTS_V2,
    allowed_mentions: { parse: [] },
    components: [{
      type: 17,
      accent_color: COLOR[kind],
      components: [
        text(`## ${title}`),
        divider(),
        text(what.map(([label, value]) => `- __${label}__ : ${value}`).join('\n')),
        divider(),
        text([`- __User__ : <@${user.id}> \`${user.username}\` \`${user.id}\``, ...where, link ? `- __Jump__ : ${link}` : null].filter(Boolean).join('\n')),
        divider(),
        text(`-# ${time()}`),
      ],
      spoiler: false,
    }],
  };
}

const queue = [];
let sending = false;
async function drain(url) {
  if (sending) return;
  sending = true;
  while (queue.length) {
    const payload = queue.shift();
    try {
      const response = await fetch(`${url}?with_components=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.status === 429) {
        const { retry_after: after = 1 } = await response.json().catch(() => ({}));
        queue.unshift(payload);
        await new Promise((resolve) => setTimeout(resolve, Math.ceil(after * 1000) + 100));
      } else if (!response.ok) {
        console.error(`Global logs webhook answered ${response.status}: ${clip(await response.text().catch(() => ''), 200)}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
    } catch (error) {
      console.error('Global logs failed:', error.message);
    }
  }
  sending = false;
}

function push(payload) {
  const url = process.env.GLOBAL_LOGS_WEBHOOK_URL;
  if (!url) return;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push(payload);
  setImmediate(() => drain(url));
}

function logCommand(message, command, used) {
  if (message.author.bot) return;
  push(card({
    kind: 'command',
    title: 'Command Used',
    what: [['Command', `\`${command.name}\``], ['Typed', `\`${clip(used, 250).replace(/`/g, "'")}\``]],
    user: message.author, guild: message.guild, channel: message.channel, link: message.url,
  }));
}

function logInteraction(interaction) {
  if (interaction.user.bot) return;
  const base = { user: interaction.user, guild: interaction.guild, channel: interaction.channel };
  if (interaction.isChatInputCommand()) {
    return push(card({ ...base, kind: 'slash', title: 'Slash Command Used', what: [['Command', `\`${clip(interaction.toString(), 250).replace(/`/g, "'")}\``]] }));
  }
  const link = interaction.message?.url;
  if (interaction.isButton()) {
    return push(card({ ...base, link, kind: 'button', title: 'Button Pressed', what: [['Button', `\`${clip(interaction.component?.label || interaction.component?.emoji?.name || 'no label', 80)}\``], ['ID', `\`${clip(interaction.customId, 100)}\``]] }));
  }
  if (interaction.isAnySelectMenu()) {
    return push(card({ ...base, link, kind: 'select', title: 'Menu Used', what: [['Menu', `\`${clip(interaction.customId, 100)}\``], ['Chose', `\`${clip(interaction.values.join(', '), 200)}\``]] }));
  }
  if (interaction.isModalSubmit()) {
    return push(card({ ...base, link, kind: 'modal', title: 'Form Submitted', what: [['Form', `\`${clip(interaction.customId, 100)}\``]] }));
  }
}

module.exports = { logCommand, logInteraction };
