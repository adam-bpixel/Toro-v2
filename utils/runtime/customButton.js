'use strict';
const { MessagePayload } = require('discord.js');
const { supportServerUrl } = require('../supportServer');

const COMPONENTS_V2 = 1 << 15;
const MAX_ROWS = 5;
const CARD_FILE = /^(profile|rank)\.(png|jpe?g|gif|webp)$/i;
const LABEL = 'Custom';

const isCardFile = (file) => {
  const name = typeof file === 'string' ? file : (file && (file.name || (typeof file.attachment === 'string' ? file.attachment : '')));
  return Boolean(name) && CARD_FILE.test(String(name).split('?')[0].split('/').pop());
};

const hasLinkButton = (components, url) => (components || []).some((row) => row && Array.isArray(row.components)
  && row.components.some((c) => c && c.style === 5 && c.label === LABEL && c.url === url));

function withCustomButton(options) {
  if (!options || typeof options !== 'object' || options instanceof MessagePayload) return options;
  const url = supportServerUrl();
  const components = options.components;
  if (components !== undefined && !Array.isArray(components)) return options;
  if (!(options.files || []).some(isCardFile) || hasLinkButton(components, url)) return options;

  const isV2 = Boolean((options.flags ?? 0) & COMPONENTS_V2) || (typeof options.flags === 'bigint' && (options.flags & BigInt(COMPONENTS_V2)));
  const rows = (components || []).length;
  if (!isV2 && rows >= MAX_ROWS) return options;
  const row = { type: 1, components: [{ type: 2, style: 5, label: LABEL, url }] };
  return { ...options, components: [...(components || []), row] };
}

let installed = false;
function install() {
  if (installed) return;
  installed = true;
  const resolveBody = MessagePayload.prototype.resolveBody;
  MessagePayload.prototype.resolveBody = function patchedResolveBody() {
    if (this.body === null || this.body === undefined) this.options = withCustomButton(this.options);
    return resolveBody.call(this);
  };
}

module.exports = { install, withCustomButton };
