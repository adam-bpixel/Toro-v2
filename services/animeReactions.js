'use strict';
const { COMPONENTS_V2, ACCENT_COLOR, notice } = require('../utils/render/embeds');
const { TICKET_EMOJI } = require('../utils/emojis');
const { resolveUser } = require('../utils/access/resolve');
const { hit } = require('../utils/runtime/cooldown');

const GIF_API = 'https://api.purrbot.site/v2/img/sfw';
const COOLDOWN_MS = 3000;
const NO_PINGS = { parse: [], repliedUser: false };

async function fetchGif(action) {
  const response = await fetch(`${GIF_API}/${action}/gif`, { signal: AbortSignal.timeout(8000) });
  const data = await response.json();
  if (data.error || !data.link) throw new Error(`purrbot returned no GIF for "${action}"`);
  return data.link;
}

function buildReactionCard({ target, actor, verb, gifUrl, requester }) {
  return {
    flags: COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          { type: 10, content: `${target} you have been ${verb} by ${actor}` },
          { type: 14, spacing: 1, divider: true },
          { type: 12, items: [{ media: { url: gifUrl }, spoiler: false }] },
          { type: 14, spacing: 1, divider: true },
          { type: 10, content: `-# ${TICKET_EMOJI.footer} ༯ Requested by ${requester.username}` },
        ],
        spoiler: false,
      },
    ],
    allowedMentions: NO_PINGS,
  };
}

function makeReactionCommand({ name, verb, description }) {
  return {
    name,
    aliases: [],
    description,
    usage: '[@member|username|ID]',
    category: 'Anime Commands',
    async execute(message, args) {
      const { onCooldown } = hit(`anime:${message.author.id}`, COOLDOWN_MS);
      if (onCooldown) return notice(message, '__Slow down a little__', { ping: false });

      let target = message.author;
      let actor = message.client.user;

      const asked = args.length > 0 || message.mentions.users.size > 0;
      if (asked) {
        const found = await resolveUser(message, args, { fallbackToAuthor: false });
        if (!found) return notice(message, "__Couldn't find that user__", { ping: false });
        if (found.id !== message.author.id) {
          target = found;
          actor = message.author;
        }
      }

      let gifUrl;
      try {
        gifUrl = await fetchGif(name);
      } catch (error) {
        console.error(`Anime reaction "${name}" GIF fetch failed:`, error);
        return notice(message, "__Couldn't fetch a GIF right now - please try again__", { ping: false });
      }

      await message.reply({
        ...buildReactionCard({ target, actor, verb, gifUrl, requester: message.author }),
        failIfNotExists: false,
      });
    },
  };
}

module.exports = { makeReactionCommand };
