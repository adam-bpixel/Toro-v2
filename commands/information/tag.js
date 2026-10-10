const { notice, usageCard } = require('../../utils/render/embeds');
const { resolveUser, resolveRole } = require('../../utils/access/resolve');

function findChannel(guild, query) {
  if (!guild) return null;
  const id = (query.match(/^<#(\d+)>$/) || query.match(/^(\d{15,25})$/) || [])[1];
  if (id && guild.channels.cache.has(id)) return guild.channels.cache.get(id);
  const clean = query.replace(/^#/, '').toLowerCase();
  return guild.channels.cache.find((c) => c.name.toLowerCase() === clean) || null;
}

module.exports = {
  name: 'tag',
  aliases: [],
  description: 'Tag a user, role, or channel',
  usage: '<@user|@role|#channel|ID|name>',
  category: 'Information Commands',
  async execute(message, args) {
    const query = args.join(' ').trim();
    if (!query) return usageCard(message, { summary: 'Tag a user, role, or channel', usage: '&tag <@user|@role|#channel|ID|name>' });

    let mention = null;
    let ping = { parse: [] };
    const asChannel = () => { const c = findChannel(message.guild, query); if (c) mention = `${c}`; };
    const asRole = () => {
      const r = resolveRole(message, query.replace(/^@/, ''));
      if (r && r.id !== message.guild.id) {
        mention = `${r}`;
        if (r.mentionable || message.member?.permissions.has('MentionEveryone')) ping = { roles: [r.id] };
      }
    };
    const asUser = async () => {
      const u = await resolveUser(message, [query.replace(/^@/, '')], { fallbackToAuthor: false });
      if (u) { mention = `${u}`; ping = { users: [u.id] }; }
    };

    if (/^<#\d+>$/.test(query) || query.startsWith('#')) asChannel();
    else if (/^<@&\d+>$/.test(query)) asRole();
    else if (/^<@!?\d+>$/.test(query)) await asUser();
    else {
      await asUser();
      if (!mention) asRole();
      if (!mention) asChannel();
    }
    if (!mention) return notice(message, '__No user, role or channel found__');

    await message.reply({ content: mention, allowedMentions: { ...ping, repliedUser: false } });
  },
};
