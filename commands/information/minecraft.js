const { card, notice, usageCard } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');

module.exports = {
  name: 'minecraft',
  aliases: ['mc'],
  description: 'Get Minecraft server information',
  usage: '<server address>',
  category: 'Information Commands',
  async execute(message, args) {
    const address = (args[0] || '').trim();
    if (!address) return usageCard(message, { summary: 'Get Minecraft server information', usage: '&minecraft <server address>' });
    const data = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(address)}`, { signal: AbortSignal.timeout(10000) })
      .then((r) => r.json()).catch(() => null);
    if (!data) return notice(message, '__Could not reach the Minecraft status service, try again later__');
    if (!data.online) return notice(message, `__**${address}** is offline or does not exist__`);

    const motd = data.motd && data.motd.clean ? data.motd.clean.join(' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null;
    const lines = [
      `__Address__ : \`${data.hostname || address}${data.port && data.port !== 25565 ? `:${data.port}` : ''}\``,
      data.ip ? `__IP__ : \`${data.ip}\`` : null,
      motd ? `__MOTD__ : ${motd}` : null,
      data.version ? `__Version__ : \`${data.version}\`` : null,
      data.players ? `__Players__ : \`${comma(data.players.online)}/${comma(data.players.max)}\`` : null,
      data.software ? `__Software__ : \`${data.software}\`` : null,
    ].filter(Boolean);
    await card(message, { title: 'Minecraft Server', lines });
  },
};
