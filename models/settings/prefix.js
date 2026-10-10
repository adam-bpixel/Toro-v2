'use strict';
const { defaultPrefix } = require('../../utils/defaultPrefix');
const { getGuildPrefix, setGuildPrefix, getUserPrefix, setUserPrefix } = require('../core/moderation');
const { COMPONENTS_V2, ACCENT_COLOR, textBlock, divider, bullet } = require('../../utils/render/embeds');
const { TICKET_EMOJI } = require('../../utils/emojis');
const { canUsePersonalPrefix } = require('../economy/premium');

const { supportServerUrl } = require('../../utils/supportServer');

const isBareBotMention = (content, botId) => {
  const text = content.trim();
  return text === `<@${botId}>` || text === `<@!${botId}>`;
};

const serverChoices = new Map();
const personalChoices = new Map();

async function lookup(cache, id, read, what) {
  if (!cache.has(id)) {
    try {
      cache.set(id, await read(id));
    } catch (error) {
      console.error(`Could not read the ${what} of ${id}:`, error.message);
      return null;
    }
  }
  return cache.get(id);
}

async function prefixesFor(guildId, userId) {
  const [chosen, personal] = await Promise.all([
    guildId ? lookup(serverChoices, guildId, getGuildPrefix, 'prefix of server') : null,
    userId ? lookup(personalChoices, userId, getUserPrefix, 'personal prefix of user') : null,
  ]);
  return { server: chosen || defaultPrefix(), personal: personal && await canUsePersonalPrefix(userId) ? personal : null };
}

const prefixFor = async (guildId) => (await prefixesFor(guildId, null)).server;

async function savePrefix(guildId, prefix) {
  await setGuildPrefix(guildId, prefix);
  serverChoices.set(guildId, prefix);
}

async function savePersonalPrefix(userId, prefix) {
  await setUserPrefix(userId, prefix);
  personalChoices.set(userId, prefix);
}

function matchPrefix(content, prefixes) {
  return prefixes.filter((prefix) => prefix && content.startsWith(prefix)).sort((a, b) => b.length - a.length)[0] || null;
}

const prefixPayload = (prefix, personal = null) => ({
  flags: COMPONENTS_V2,
  components: [{
    type: 17,
    accent_color: ACCENT_COLOR,
    components: [
      textBlock(`## ${TICKET_EMOJI.footer} My Prefixes`),
      divider(),
      textBlock([bullet(`__Server Prefix__ \`${prefix}\``), ...(personal ? [bullet(`__Personal Prefix__ \`${personal}\``)] : [])].join('\n')),
      textBlock(`${bullet(`__Use \`${prefix}help\` to see all commands__`)}\n- __Support Server [Join Here](<${supportServerUrl()}>)__  ༯`),
    ],
    spoiler: false,
  }],
});

module.exports = { isBareBotMention, prefixPayload, prefixesFor, prefixFor, savePrefix, savePersonalPrefix, matchPrefix };
