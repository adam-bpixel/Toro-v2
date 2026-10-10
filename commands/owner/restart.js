const { spawn } = require('node:child_process');
const { card, notice } = require('../../utils/render/embeds');
const { OWNER_EMOJI } = require('../../utils/emojis');
const { isOwner } = require('../../models/economy/premium');

const supervised = () => Boolean(process.env.pm_id || process.env.NODEMON || process.env.NODE_APP_INSTANCE);

module.exports = {
  name: 'restart',
  aliases: [],
  description: 'Restart the bot',
  usage: '',
  category: 'Owner Commands',
  async execute(message, args, client) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    await card(message, { title: `${OWNER_EMOJI.restart} Restart`, lines: ['__Restarting, back in a few seconds__'] });
    if (!supervised()) {
      spawn(process.execPath, process.argv.slice(1), { cwd: process.cwd(), detached: true, stdio: 'inherit' }).unref();
    }
    await client.destroy();
    process.exit(0);
  },
};
