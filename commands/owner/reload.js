const path = require('node:path');
const { card, notice } = require('../../utils/render/embeds');
const { OWNER_EMOJI } = require('../../utils/emojis');
const { isOwner } = require('../../models/economy/premium');
const { commandFiles, addCommand } = require('../../utils/runtime/loader');

module.exports = {
  name: 'reload',
  aliases: ['rel'],
  description: 'Reload the commands from disk',
  usage: '[command]',
  category: 'Owner Commands',
  async execute(message, args, client) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const wanted = (args[0] || '').toLowerCase();
    const files = wanted
      ? commandFiles().filter((file) => {
        const cached = require.cache[file]?.exports;
        return cached && (cached.name === wanted || (cached.aliases || []).includes(wanted));
      })
      : commandFiles();
    if (wanted && !files.length) return notice(message, `__No command named **${wanted}**__`);

    let loaded = 0;
    const failed = [];
    for (const file of files) {
      try {
        delete require.cache[file];
        addCommand(client, file);
        loaded += 1;
      } catch (error) {
        failed.push(`\`${path.basename(file)}\` : ${error.message}`);
      }
    }
    await card(message, {
      title: `${OWNER_EMOJI.reload} Reload`,
      lines: [
        wanted ? `__Reloaded__ **${wanted}**` : `__Reloaded__ \`${loaded}\` __commands__`,
        '__Code in `utils/`, `models/` and `handlers/` is only reloaded by `&restart`__',
        ...failed.map((line) => `__Failed__ : ${line}`),
      ],
    });
  },
};
