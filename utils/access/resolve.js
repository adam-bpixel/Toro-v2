'use strict';
async function resolveUser(message, args, { fallbackToAuthor = true } = {}) {
  const query = args[0];
  if (!query) return message.mentions.users.first() || (fallbackToAuthor ? message.author : null);

  const id = (query.match(/^<@!?(\d{15,25})>$/) || [])[1] || (/^\d{15,25}$/.test(query) ? query : null);
  if (id) {
    const byId = message.mentions.users.get(id) || await message.client.users.fetch(id).catch(() => null);
    if (byId) return byId;
    return fallbackToAuthor ? message.author : null;
  }

  if (message.guild) {
    const clean = query.replace(/^@/, '').toLowerCase();
    const cached = message.guild.members.cache.find(
      (m) => m.user.username.toLowerCase() === clean || m.displayName.toLowerCase() === clean,
    );
    if (cached) return cached.user;

    const fetched = await message.guild.members.fetch({ query, limit: 1 }).catch(() => null);
    const first = fetched && fetched.first();
    if (first) return first.user;
  }

  return fallbackToAuthor ? message.author : null;
}

function resolveRole(message, query) {
  if (!message.guild || !query) return null;

  const mentionMatch = query.match(/^<@&(\d+)>$/);
  const id = mentionMatch ? mentionMatch[1] : (/^\d{15,25}$/.test(query) ? query : null);
  if (id) {
    const byId = message.guild.roles.cache.get(id);
    if (byId) return byId;
  }

  const clean = query.toLowerCase();
  const exact = message.guild.roles.cache.find((r) => r.name.toLowerCase() === clean);
  if (exact) return exact;

  return message.guild.roles.cache.find((r) => r.name.toLowerCase().startsWith(clean)) || null;
}

module.exports = { resolveUser, resolveRole };
