const { card, notice } = require('../../utils/render/embeds');
const { comma } = require('../../utils/format');

function extractServerId(input) {
  const joinMatch = input.match(/cfx\.re\/join\/([a-z0-9]+)/i);
  if (joinMatch) return joinMatch[1];
  return /^[a-z0-9]{6}$/i.test(input) ? input : null;
}

module.exports = {
  name: 'fivem',
  aliases: [],
  description: 'Get FiveM server information',
  usage: '<server_id|ip:port|name>',
  category: 'Information Commands',
  dmAllowed: true,
  async execute(message, args) {
    if (!args.length) {
      return card(message, {
        title: 'FiveM Command',
        lines: ['__`&fivem <server_id|ip:port|name>`__', '__Get detailed information about a FiveM server__'],
      });
    }

    const serverId = extractServerId(args[0]);
    if (!serverId) {
      return notice(message, '__Give a FiveM server code (e.g. `888j4v`, or a `cfx.re/join/...` link) - IP:port and name search need the code too__');
    }

    let data;
    try {
      const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${serverId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; discord-bot/1.0)' },
      });
      const json = res.ok ? await res.json() : null;
      data = json && json.Data;
    } catch {
      data = null;
    }
    if (!data) return notice(message, `__No FiveM server found with ID **${serverId}**__`);

    const vars = data.vars || {};
    await card(message, {
      title: 'FiveM Server',
      lines: [
        `__**Name**__ : ${data.hostname || vars.sv_projectName || 'Unknown'}`,
        `__**ID**__ : \`${serverId}\``,
        `__**Players**__ : \`${comma(data.clients || 0)}/${comma(data.sv_maxclients || 0)}\``,
        `__**Game**__ : \`${data.gametype || 'Unknown'}\``,
        `__**Map**__ : \`${data.mapname || 'Unknown'}\``,
        `__**Resources**__ : \`${(data.resources || []).length}\``,
      ],
      extraRows: [{
        type: 1,
        components: [{ type: 2, style: 5, label: 'Connect', url: `https://cfx.re/join/${serverId}` }],
      }],
    });
  },
};
