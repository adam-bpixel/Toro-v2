'use strict';
const { localize } = require('../localize');
const COMPONENTS_V2 = 1 << 15;
const ACCENT_COLOR = 13944790;

const textBlock = (content) => ({ type: 10, content });
const divider = () => ({ type: 14, spacing: 1, divider: true });
const bullet = (line) => `- ${line}  ⁘`;

function container({ accentColor = ACCENT_COLOR, title, lines = [], fields, extraRows = [] } = {}) {
  const parts = [textBlock(`## ${title}`), divider()];
  if (fields && fields.length) {
    fields.forEach((field, i) => {
      if (i > 0) parts.push(divider());
      parts.push(textBlock(bullet(field)));
    });
  } else if (lines.length) {
    parts.push(textBlock(lines.map(bullet).join('\n')));
  }
  for (const row of extraRows) parts.push(divider(), row);
  return { type: 17, accent_color: accentColor, components: parts, spoiler: false };
}

function payloadOf(opts) {
  return { flags: COMPONENTS_V2, components: [container(opts)] };
}

async function card(message, { title, lines, accentColor, ping = true, extraRows } = {}) {
  return message.reply(await localize(message, {
    ...payloadOf({ title, lines, accentColor, extraRows }),
    allowedMentions: { repliedUser: ping },
  }));
}

async function notice(message, lines, { title = 'Notice', ping = true } = {}) {
  return card(message, { title, lines: Array.isArray(lines) ? lines : [lines], ping });
}

async function usageCard(message, { summary, usage, notes = [], ping = true } = {}) {
  const parts = [
    textBlock('## Command'), divider(),
    textBlock(bullet(`__${summary}__`)), divider(),
    textBlock('## Usage'), divider(),
    textBlock([`__\`${usage}\`__`, ...notes].map(bullet).join('\n')),
  ];
  return message.reply(await localize(message, {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }],
    allowedMentions: { repliedUser: ping },
  }));
}

module.exports = { container, payloadOf, card, notice, usageCard, textBlock, divider, bullet, ACCENT_COLOR, COMPONENTS_V2 };
