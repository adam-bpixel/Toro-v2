'use strict';
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider } = require('./embeds');
const { EMOJI, TICKET_EMOJI } = require('../emojis');

const two = (n) => String(n).padStart(2, '0');
const stamp = (d) => `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
const unix = (date) => Math.floor(date.getTime() / 1000);

const subscriptionStatus = (subscription, { owner = false } = {}) => (owner || subscription ? `${EMOJI.premiumActive} Active` : `${EMOJI.premiumFree} Inactive`);

function subscriptionLines(subscription, { owner = false } = {}) {
  const lines = [];
  if (subscription?.since) lines.push(`- __Premium since__  <t:${unix(subscription.since)}:D>`);
  if (owner || subscription) lines.push(`- __Expires__  ${owner || !subscription.expiresAt ? 'Never' : `<t:${unix(subscription.expiresAt)}:R>`}`);
  return lines;
}

function subscriptionBlock(title, image, lines) {
  return [
    textBlock(`## <:members:1551750325835268146> ${title}`),
    divider(),
    { type: 9, components: [textBlock(lines.join('\n'))], accessory: { type: 11, media: { url: image }, description: null, spoiler: false } },
  ];
}

function subscriptionCard(blocks) {
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        ...blocks.flatMap((block, i) => (i ? [divider(), ...block] : block)),
        divider(),
        textBlock(`-# ${TICKET_EMOJI.footer} • Subscriptions • ${stamp(new Date())}`),
      ],
      spoiler: false,
    }],
    allowedMentions: { parse: [], repliedUser: true },
  };
}

module.exports = { subscriptionStatus, subscriptionLines, subscriptionBlock, subscriptionCard };
