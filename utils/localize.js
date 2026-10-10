'use strict';
const COMMAND_PREFIX = /(?<=[`[])&(?=[a-z])/gi;

async function prefixOf(source) {
  const { prefixesFor } = require('../models/settings/prefix');
  const user = source.author || source.user;
  const { server, personal } = await prefixesFor(source.guild?.id, user?.id);
  return personal || server;
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function swapName(text, prefix, swap) {
  if (!swap) return text;
  return text.replace(new RegExp(`(?<!\\w)${escapeRegex(prefix)}${escapeRegex(swap.from)}(?![\\w-])`, 'gi'), () => `${prefix}${swap.to}`);
}

function withPrefix(value, prefix, swap = null) {
  if (typeof value === 'string') return swapName(value.replace(COMMAND_PREFIX, () => prefix), prefix, swap);
  if (Array.isArray(value)) return value.map((item) => withPrefix(item, prefix, swap));
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = key === 'custom_id' ? item : withPrefix(item, prefix, swap);
    return out;
  }
  return value;
}

const localize = async (source, payload) => withPrefix(payload, await prefixOf(source), source.invokedAs);

module.exports = { COMMAND_PREFIX, prefixOf, withPrefix, swapName, localize };
