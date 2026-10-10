const { card, notice, usageCard } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');

module.exports = {
  name: 'xbox',
  aliases: ['gamertag'],
  description: 'Get Xbox Gamertag information',
  usage: '<gamertag>',
  category: 'Information Commands',
  async execute(message, args) {
    const gamertag = args.join(' ').trim();
    if (!gamertag) return usageCard(message, { summary: 'Get Xbox Gamertag information', usage: '&xbox <gamertag>' });
    if (!process.env.XBL_API_KEY) return notice(message, '__Xbox lookup is not set up yet__');

    const res = await fetch(`https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`, {
      headers: { 'X-Authorization': process.env.XBL_API_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    }).then((r) => r.json()).catch(() => null);
    const person = res && res.people && res.people[0];
    if (!person) return notice(message, `__No Xbox profile found for **${gamertag}**__`);

    const lines = [
      `__Gamertag__ : ${person.gamertag}`,
      person.realName ? `__Real name__ : ${person.realName}` : null,
      person.gamerScore != null ? `__Gamerscore__ : \`${comma(Number(person.gamerScore) || 0)}\`` : null,
      person.presenceState ? `__Status__ : ${person.presenceState}` : null,
      person.xboxOneRep ? `__Reputation__ : ${person.xboxOneRep}` : null,
      person.detail && person.detail.bio ? `__Bio__ : ${person.detail.bio.slice(0, 200)}` : null,
      `__XUID__ : \`${person.xuid}\``,
    ].filter(Boolean);
    const avatar = person.displayPicRaw;
    await card(message, { title: 'Xbox Profile', lines, extraRows: avatar ? [{ type: 12, items: [{ media: { url: avatar } }] }] : [] });
  },
};
