const { card, COMPONENTS_V2, ACCENT_COLOR, textBlock, divider } = require('../../utils/render/embeds');
const { PING_EMOJI } = require('../../utils/emojis');

module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Check bot latency',
  usage: '',
  category: 'Information Commands',
  async execute(message, args, client) {
    const started = Date.now();
    const sent = await card(message, { title: 'Ping', lines: ['__Pinging...__'] });
    const botLatency = Date.now() - started;
    const apiLatency = Math.round(client.ws.ping);
    const shard = (client.shard?.ids[0] ?? 0) + 1;

    await sent.edit({
      flags: COMPONENTS_V2,
      components: [{
        type: 17,
        accent_color: ACCENT_COLOR,
        components: [
          textBlock(`## Pong ${PING_EMOJI.title}`),
          divider(),
          textBlock(`• __Bot Latency__ : \`${botLatency}ms\`\n• __API Latency__ : \`${apiLatency >= 0 ? apiLatency : '?'}ms\`\n• __Shard__ : \`#${shard}\``),
        ],
        spoiler: false,
      }],
    });
  },
};
