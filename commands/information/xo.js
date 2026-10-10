const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { notice } = require('../../utils/render/embeds');

const COLOR = 13944790;
const SEARCH_MS = 120_000;
const IDLE_MS = 120_000;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

let waiting = null;
const busy = new Set();

function winnerOf(board) {
  for (const [a, b, c] of LINES) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : null;
}

function boardRows(game, disabled) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      const cell = game.board[i];
      row.addComponents(new ButtonBuilder()
        .setCustomId(`xo_${game.id}_${i}`)
        .setLabel(cell || '​')
        .setStyle(cell === 'X' ? ButtonStyle.Danger : cell === 'O' ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(disabled || Boolean(cell)));
    }
    rows.push(row);
  }
  return rows;
}

function render(game, viewer, result) {
  const [x, o] = game.players;
  const turnPlayer = game.players[game.turn];
  let status;
  if (result === 'draw') status = "It's a draw!";
  else if (result) status = `**${game.players[result === 'X' ? 0 : 1].user.username}** wins!`;
  else if (result === undefined && game.over) status = game.over;
  else status = turnPlayer === viewer ? '**Your turn**' : `Waiting for **${turnPlayer.user.username}**...`;
  const finished = Boolean(result) || Boolean(game.over);
  return {
    embeds: [{
      title: 'Tic-Tac-Toe',
      description: `❌ **${x.user.username}** (${x.guildName})\n⭕ **${o.user.username}** (${o.guildName})\n\n${status}`,
      color: COLOR,
    }],
    components: boardRows(game, finished),
  };
}

function finish(game, result) {
  for (const p of game.players) {
    busy.delete(p.user.id);
    if (p.collector) p.collector.stop('done');
  }
  return Promise.all(game.players.map((p) => p.message.edit(render(game, p, result)).catch(() => {})));
}

function startGame(first, second) {
  const game = { id: Date.now().toString(36), board: Array(9).fill(null), turn: 0, players: [first, second], over: null };
  for (const p of game.players) {
    p.guildName = p.channel.guild ? p.channel.guild.name : 'DM';
  }
  return Promise.all(game.players.map(async (p, index) => {
    p.message = await p.channel.send(render(game, p)).catch(() => null);
    if (!p.message) return;
    p.collector = p.message.createMessageComponentCollector({ componentType: ComponentType.Button, idle: IDLE_MS });
    p.collector.on('collect', async (interaction) => {
      if (interaction.user.id !== p.user.id) return interaction.reply({ content: "This isn't your game.", ephemeral: true });
      if (game.players[game.turn] !== p) return interaction.reply({ content: "It's not your turn.", ephemeral: true });
      const cell = Number(interaction.customId.split('_')[2]);
      if (game.board[cell]) return interaction.deferUpdate();
      game.board[cell] = game.turn === 0 ? 'X' : 'O';
      const result = winnerOf(game.board);
      if (result) {
        await interaction.deferUpdate().catch(() => {});
        return finish(game, result);
      }
      game.turn = 1 - game.turn;
      await interaction.update(render(game, p));
      const other = game.players[1 - index];
      if (other.message) other.message.edit(render(game, other)).catch(() => {});
    });
    p.collector.on('end', (_, reason) => {
      if (reason === 'done' || game.over) return;
      game.over = 'The game ended because nobody played for a while.';
      finish(game, undefined);
    });
  }));
}

module.exports = {
  name: 'xo',
  aliases: ['tictactoe', 'ttt'],
  description: 'Play Tic-Tac-Toe with random players across servers',
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    const user = message.author;
    if (busy.has(user.id)) return notice(message, '__You are already searching for or playing a game__');
    busy.add(user.id);

    if (waiting && waiting.user.id !== user.id) {
      const opponent = waiting;
      waiting = null;
      clearTimeout(opponent.timer);
      opponent.message.delete().catch(() => {});
      return startGame({ user: opponent.user, channel: opponent.channel }, { user, channel: message.channel });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`xo_cancel_${user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );
    const searching = await message.reply({
      embeds: [{ title: 'Tic-Tac-Toe', description: '🔎 Searching for an opponent across servers...', color: COLOR }],
      components: [row],
      allowedMentions: { repliedUser: false },
    });
    const entry = { user, channel: message.channel, message: searching, timer: null };
    waiting = entry;

    const leave = (text) => {
      if (waiting === entry) waiting = null;
      busy.delete(user.id);
      clearTimeout(entry.timer);
      return searching.edit({ embeds: [{ title: 'Tic-Tac-Toe', description: text, color: COLOR }], components: [] }).catch(() => {});
    };
    entry.timer = setTimeout(() => { if (waiting === entry) leave('No opponent was found, try again later.'); }, SEARCH_MS);
    searching.createMessageComponentCollector({ componentType: ComponentType.Button, time: SEARCH_MS }).on('collect', async (i) => {
      if (i.user.id !== user.id) return i.reply({ content: "This isn't your search.", ephemeral: true });
      await i.deferUpdate().catch(() => {});
      if (waiting === entry) leave('Search cancelled.');
    });
  },
};
