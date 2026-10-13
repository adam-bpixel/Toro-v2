const { card, notice, usageCard } = require('../../utils/render/embeds');

module.exports = {
  name: 'appstore',
  aliases: [],
  description: 'Search for apps on the Apple App Store',
  usage: '<app name>',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    if (!args.length) {
      return usageCard(message, {
        summary: 'Search for apps on the Apple App Store',
        usage: '&appstore <app name>',
        notes: ['&appstore Discord'],
      });
    }

    const query = args.join(' ');
    let app = null;
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=1`);
      const json = res.ok ? await res.json() : null;
      app = json && json.results && json.results[0];
    } catch {
      app = null;
    }

    if (!app) return notice(message, `__No app found with name **${query}**__`);

    await card(message, {
      title: app.trackName,
      lines: [
        `__**Developer**__ : ${app.artistName}`,
        `__**Price**__ : ${app.formattedPrice || 'Free'}`,
        `__**Rating**__ : ${app.averageUserRating ? `${app.averageUserRating.toFixed(1)}/5 (${app.userRatingCount} ratings)` : 'No ratings yet'}`,
        `__**Category**__ : ${app.primaryGenreName}`,
        `[View on the App Store](${app.trackViewUrl})`,
      ],
    });
  },
};
