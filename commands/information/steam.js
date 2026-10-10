const { card, notice, usageCard } = require('../../utils/render/embeds');

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
  return m ? m[1].trim() : null;
};

module.exports = {
  name: 'steam',
  aliases: [],
  description: 'Get Steam user information by username or SteamID64',
  usage: '<username|SteamID64>',
  category: 'Information Commands',
  async execute(message, args) {
    const query = (args[0] || '').replace(/^(?:https?:\/\/)?steamcommunity\.com\/(?:id|profiles)\//i, '').replace(/\/+$/, '');
    if (!query) return usageCard(message, { summary: 'Get Steam user information by username or SteamID64', usage: '&steam <username|SteamID64>' });

    const path = /^\d{17}$/.test(query) ? `profiles/${query}` : `id/${encodeURIComponent(query)}`;
    const xml = await fetch(`https://steamcommunity.com/${path}/?xml=1`, { signal: AbortSignal.timeout(10000) })
      .then((r) => r.text()).catch(() => null);
    if (!xml) return notice(message, '__Could not reach Steam, try again later__');
    const id64 = tag(xml, 'steamID64');
    if (!id64) return notice(message, `__No Steam user found for **${query}**__`);

    const lines = [
      `__Name__ : ${tag(xml, 'steamID')}`,
      tag(xml, 'realname') ? `__Real name__ : ${tag(xml, 'realname')}` : null,
      `__SteamID64__ : \`${id64}\``,
      `__Status__ : ${tag(xml, 'stateMessage') ? tag(xml, 'stateMessage').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : tag(xml, 'onlineState')}`,
      tag(xml, 'location') ? `__Location__ : ${tag(xml, 'location')}` : null,
      tag(xml, 'memberSince') ? `__Member since__ : ${tag(xml, 'memberSince')}` : null,
      tag(xml, 'hoursPlayed2Wk') ? `__Hours (2 weeks)__ : \`${tag(xml, 'hoursPlayed2Wk')}\`` : null,
      `__Profile__ : ${tag(xml, 'privacyState') || 'unknown'}`,
      tag(xml, 'vacBanned') === '1' ? '__VAC banned__ : Yes' : null,
      `__Link__ : https://steamcommunity.com/profiles/${id64}`,
    ].filter(Boolean);
    const avatar = tag(xml, 'avatarFull');
    const extraRows = avatar ? [{ type: 12, items: [{ media: { url: avatar } }] }] : [];
    await card(message, { title: 'Steam User', lines, extraRows });
  },
};
