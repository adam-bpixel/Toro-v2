'use strict';
const { ChannelType, PermissionFlagsBits, Collection } = require('discord.js');
const { card, notice } = require('../utils/render/embeds');
const { checkTarget } = require('../utils/access/permissions');
const { lacksPermission } = require('../utils/access/gate');
const { addBalance, spendBalance } = require('../models/economy/economy');
const { comma, parseDuration } = require('../utils/format');
const { EMOJI } = require('../utils/emojis');
const { getGuildConfig, updateGuildConfig } = require('../models/core/moderation');
const giveaway = require('../models/economy/giveaway');
const autoreply = require('../models/settings/autoreply');
const verification = require('../models/enforcement/verification');
const moderation = require('../services/moderation');
const { buildTicketPanel, withCustom, MAX_CUSTOM } = require('./ticketPanel');

const USER = 6, CHANNEL = 7, ROLE = 8, MENTIONABLE = 9, ATTACHMENT = 11;

const missing = (message) => notice(message, '__This command is not set up yet__');

const need = (message, flag) => (message.member.permissions.has(flag) ? null : notice(message, "__You don't have permission__"));

async function targetMember(message, target) {
  const { member, reason } = await moderation.targetMember(message, target);
  return member ? { member } : { error: notice(message, `__${reason}__`) };
}

// The /mperm permission choices, mapped to their PermissionFlagsBits key.
const PERMISSIONS = {
  send_messages: 'SendMessages', view_channel: 'ViewChannel', connect: 'Connect', speak: 'Speak', attach_files: 'AttachFiles',
  embed_links: 'EmbedLinks', add_reactions: 'AddReactions', external_emojis: 'UseExternalEmojis', manage_messages: 'ManageMessages',
  mention_everyone: 'MentionEveryone', stream: 'Stream', voice_activity: 'UseVAD', create_threads: 'CreatePublicThreads',
};

const natives = {
  async ban(message, get) {
    const denied = need(message, PermissionFlagsBits.BanMembers);
    if (denied) return denied;
    return moderation.ban(message, get('member'), { reason: get('reason'), deleteDays: get('delete_days') || 0 });
  },
  async kick(message, get) {
    const denied = need(message, PermissionFlagsBits.KickMembers);
    if (denied) return denied;
    return moderation.kick(message, get('member'), get('reason'));
  },
  async unban(message, get) {
    const denied = need(message, PermissionFlagsBits.BanMembers);
    if (denied) return denied;
    return moderation.unban(message, get('user').id, get('reason'));
  },
  async timeout(message, get) {
    const denied = need(message, PermissionFlagsBits.ModerateMembers);
    if (denied) return denied;
    return moderation.timeout(message, get('member'), parseDuration(get('duration')), get('reason'));
  },
  async untimeout(message, get) {
    const denied = need(message, PermissionFlagsBits.ModerateMembers);
    if (denied) return denied;
    return moderation.untimeout(message, get('member'));
  },
  async nickname(message, get) {
    const denied = need(message, PermissionFlagsBits.ManageNicknames);
    if (denied) return denied;
    return moderation.nickname(message, get('member'), get('nickname'));
  },
  async mperm(message, get) {
    const denied = need(message, PermissionFlagsBits.ManageRoles);
    if (denied) return denied;
    return moderation.editPermission(message, { id: get('target').id, flag: PERMISSIONS[get('permission')], state: get('state') });
  },
  async suppress(message, get) {
    const denied = need(message, PermissionFlagsBits.MuteMembers);
    if (denied) return denied;
    const target = get('member');
    const { member, error } = await targetMember(message, target);
    if (error) return error;
    if (!member.voice.channelId) return notice(message, '__That member is not in a voice channel__');
    const mute = !member.voice.serverMute;
    const done = await member.voice.setMute(mute).then(() => true).catch(() => false);
    if (!done) return notice(message, "__Couldn't change that member's voice state__");
    return card(message, { title: 'Command', lines: [`__${mute ? 'Muted' : 'Unmuted'}__ **${target.username}** __in voice__`] });
  },
  async moveall(message, get) {
    const denied = need(message, PermissionFlagsBits.MoveMembers);
    if (denied) return denied;
    const from = get('from');
    const to = get('to');
    if (from.id === to.id) return notice(message, '__Choose two different voice channels__');
    const members = [...from.members.values()].filter((m) => m.id === message.author.id || checkTarget(message, m).ok);
    if (!members.length) return notice(message, '__Nobody in that voice channel can be moved by you__');
    const moved = (await Promise.all(members.map((m) => m.voice.setChannel(to).then(() => 1).catch(() => 0)))).reduce((a, b) => a + b, 0);
    return card(message, { title: 'Command', lines: [`__Moved__ \`${moved}\`/\`${members.length}\` __members to__ ${to}`] });
  },
  async join(message, get) {
    const denied = need(message, PermissionFlagsBits.MoveMembers);
    if (denied) return denied;
    const target = get('channel') || message.member.voice.channel;
    if (!target) return notice(message, '__Choose a voice channel or join one first__');
    const { joinVoiceChannel } = require('@discordjs/voice');
    joinVoiceChannel({ channelId: target.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: true });
    return card(message, { title: 'Command', lines: [`__Joined__ ${target}`] });
  },
  async leave(message) {
    const denied = need(message, PermissionFlagsBits.MoveMembers);
    if (denied) return denied;
    const { getVoiceConnection } = require('@discordjs/voice');
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return notice(message, '__I am not in a voice channel__');
    connection.destroy();
    return card(message, { title: 'Command', lines: ['__Left the voice channel__'] });
  },
  async transfer(message, get) {
    const target = get('member');
    const amount = get('amount');
    if (target.bot) return notice(message, "__You can't send RVP to a bot__");
    if (target.id === message.author.id) return notice(message, "__You can't send RVP to yourself__");
    if (amount < 1) return notice(message, '__The amount must be at least 1__');
    if ((await spendBalance(message.author.id, amount)) === null) return notice(message, "__You don't have enough RVP__");
    await addBalance(target.id, amount);
    return card(message, { title: 'RVP Transfer', lines: [`__Sent__ \`${comma(amount)}\` ${EMOJI.coin} __to__ **${target.username}**`] });
  },

  ...Object.fromEntries([['setmuted', 'mutedRoleId'], ['verificator', 'verificatorRoleIds']].map(([name, field]) => [name, async (message, get, sub) => {
    const denied = need(message, PermissionFlagsBits.Administrator);
    if (denied) return denied;
    const title = name === 'setmuted' ? 'Muted Role' : 'Verificator Roles';
    const config = await getGuildConfig(message.guild.id);
    if (name === 'setmuted') {
      if (sub === 'show') {
        const current = config.mutedRoleId && message.guild.roles.cache.get(config.mutedRoleId);
        return card(message, { title, lines: [current ? `__Current muted role__ : ${current}` : '__No muted role configured__'] });
      }
      const picked = get('role');
      await updateGuildConfig(message.guild.id, { $set: { mutedRoleId: picked.id } });
      return card(message, { title, lines: [`__Set the muted role to__ ${picked}`] });
    }
    if (sub === 'list') {
      const roles = (config[field] || []).map((id) => message.guild.roles.cache.get(id)).filter(Boolean);
      return card(message, { title, lines: roles.length ? roles.map((r) => `${r}`) : ['__No verificator roles configured__'] });
    }
    const picked = get('role');
    await updateGuildConfig(message.guild.id, sub === 'add' ? { $addToSet: { [field]: picked.id } } : { $pull: { [field]: picked.id } });
    return card(message, { title, lines: [`__${sub === 'add' ? 'Added' : 'Removed'}__ ${picked} __${sub === 'add' ? 'as' : 'from'} a verificator role__`] });
  }])),

  async 'ticket-category'(message, get, sub) {
    const denied = need(message, PermissionFlagsBits.Administrator);
    if (denied) return denied;
    const guild = message.guild;
    const config = await getGuildConfig(guild.id);
    const custom = config.customTicketCategories || [];
    const all = withCustom(custom);
    if (sub === 'list') {
      return card(message, { title: 'Ticket Categories', lines: all.map((c) => `${c.emoji} **${c.label}** : \`${c.desc}\`${custom.some((x) => x.id === c.id) ? '' : ' (built-in)'}`) });
    }
    if (sub === 'add') {
      const label = get('name').trim();
      const id = label.toLowerCase().replace(/[^a-z]/g, '');
      if (id.length < 2) return notice(message, '__The name needs at least two letters__');
      if (all.some((c) => c.id === id)) return notice(message, '__A ticket category with that name already exists__');
      if (custom.length >= MAX_CUSTOM) return notice(message, `__You can add ${MAX_CUSTOM} categories at most - remove one first__`);
      const emoji = get('emoji');
      if (emoji && !/^<a?:[^:]+:\d+>$/.test(emoji) && !/^\p{Extended_Pictographic}/u.test(emoji)) return notice(message, '__That is not an emoji__');
      const category = { id, label, desc: get('description') || 'Open a ticket', emoji: emoji || null };
      await updateGuildConfig(guild.id, { $push: { customTicketCategories: category } });
      await refreshTicketPanel(guild);
      return card(message, { title: 'Ticket Categories', lines: [`__Added__ **${label}**`] });
    }
    const wanted = get('name').trim().toLowerCase();
    const found = custom.find((c) => c.id === wanted.replace(/[^a-z]/g, '') || c.label.toLowerCase() === wanted);
    if (!found) return notice(message, "__Couldn't find that category (built-in ones can't be removed)__");
    await updateGuildConfig(guild.id, { $pull: { customTicketCategories: { id: found.id } } });
    await refreshTicketPanel(guild);
    return card(message, { title: 'Ticket Categories', lines: [`__Removed__ **${found.label}**`] });
  },

  async 'ticket-close'(message) {
    const { closeTicket, parseTopic } = require('./tickets/ticketActions');
    const info = parseTopic(message.channel && message.channel.topic);
    if (!info) return notice(message, '__This channel is not a ticket__');
    if (message.author.id !== info.userId && !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return notice(message, "__You don't have permission__");
    return closeTicket(message.interaction, message.channelId);
  },

  async 'setup-verification'(message, get) {
    const denied = need(message, PermissionFlagsBits.Administrator);
    if (denied) return denied;
    const boy = get('boy_role');
    const girl = get('girl_role');
    const unverified = get('unverified_role');
    if (boy.id === girl.id) return notice(message, '__Choose two different roles__');
    if (unverified && (unverified.id === boy.id || unverified.id === girl.id)) {
      return notice(message, '__The unverified role must be different from the boy/girl roles__');
    }
    await updateGuildConfig(message.guild.id, {
      $set: { 'verification.boyRoleId': boy.id, 'verification.girlRoleId': girl.id, 'verification.unverifiedRoleId': unverified ? unverified.id : null },
    });
    return verification.show(message);
  },

  'verification-show': (message) => verification.show(message),

  async torocord(message) {
    const denied = need(message, PermissionFlagsBits.Administrator);
    if (denied) return denied;
    const guild = message.guild;
    const config = await getGuildConfig(guild.id);
    const saved = config.torocord || {};
    const existing = (id) => (id ? guild.channels.cache.get(id) : null);
    const hidden = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: message.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ];
    try {
      const category = existing(saved.categoryId) || await guild.channels.create({ name: 'ToroCord', type: ChannelType.GuildCategory, permissionOverwrites: hidden });
      const logs = existing(saved.logsId) || await guild.channels.create({ name: 'toro-logs', type: ChannelType.GuildText, parent: category.id, topic: 'Ticket and verification logs' });
      const updates = existing(saved.updatesId) || await guild.channels.create({ name: 'toro-updates', type: ChannelType.GuildText, parent: category.id, topic: 'Bot news and updates' });
      const set = { torocord: { categoryId: category.id, logsId: logs.id, updatesId: updates.id } };
      if (!config.ticketLogChannelId) set.ticketLogChannelId = logs.id;
      if (config.verification && !config.verification.logChannelId) set['verification.logChannelId'] = logs.id;
      await updateGuildConfig(guild.id, { $set: set });
      return card(message, { title: 'ToroCord', lines: [`__Category__ : ${category}`, `__Logs__ : ${logs}`, `__Updates__ : ${updates}`] });
    } catch (error) {
      return notice(message, "__Couldn't create the channels (check my Manage Channels permission)__");
    }
  },

  async giveaway(message, get, sub) {
    const denied = need(message, PermissionFlagsBits.ManageGuild);
    if (denied) return denied;
    const client = message.client;
    if (sub === 'create') {
      const durationMs = giveaway.parseDuration(get('duration'));
      if (!durationMs) return notice(message, '__Give a duration like `30m`, `1h` or `1d`__');
      const where = get('channel') || message.channel;
      const made = await giveaway.create(client, { guild: message.guild, channel: where, hostId: (get('host') || message.author).id, prize: get('prize'), durationMs, winners: get('winners') || 1 });
      if (!made) return notice(message, "__Couldn't post the giveaway - check my permissions in that channel__");
      return card(message, { title: 'Giveaway', lines: [`__Created__ **${get('prize')}** __in__ ${where}`, `__Message ID__ : \`${made.gw.messageId}\``] });
    }
    if (sub === 'list') {
      const active = await giveaway.listActive(message.guild.id);
      return card(message, {
        title: 'Giveaways',
        lines: active.length
          ? active.map((g) => `**${g.prize}** - <t:${Math.floor(g.endsAt / 1000)}:R> - \`${g.entries.length}\` entries - ID \`${g.messageId}\``)
          : ['__No active giveaways__'],
      });
    }
    const gw = await giveaway.find(message.guild.id, get('message_id'));
    if (!gw) return notice(message, "__Couldn't find a giveaway with that message ID__");
    if (sub === 'end') {
      if (gw.ended) return notice(message, '__That giveaway already ended__');
      await giveaway.end(client, gw.messageId);
      return card(message, { title: 'Giveaway', lines: [`__Ended__ **${gw.prize}**`] });
    }
    if (sub === 'reroll') {
      if (!gw.ended) return notice(message, "__That giveaway hasn't ended yet__");
      await giveaway.reroll(client, gw);
      return card(message, { title: 'Giveaway', lines: [`__Rerolled__ **${gw.prize}**`] });
    }
    if (sub === 'delete') {
      await giveaway.remove(client, gw);
      return card(message, { title: 'Giveaway', lines: [`__Deleted__ **${gw.prize}**`] });
    }
    if (gw.ended) return notice(message, "__You can't edit a giveaway that already ended__");
    const durationText = get('duration');
    const durationMs = durationText ? giveaway.parseDuration(durationText) : null;
    if (durationText && !durationMs) return notice(message, '__Give a duration like `30m`, `1h` or `1d`__');
    await giveaway.edit(client, gw, { prize: get('prize'), winners: get('winners'), durationMs });
    return card(message, { title: 'Giveaway', lines: [`__Updated__ **${get('prize') || gw.prize}**`] });
  },
};

async function refreshTicketPanel(guild) {
  const config = await getGuildConfig(guild.id);
  const channel = config.ticketPanelChannelId && guild.channels.cache.get(config.ticketPanelChannelId);
  const posted = channel && config.ticketPanelMessageId && await channel.messages.fetch(config.ticketPanelMessageId).catch(() => null);
  if (posted) await posted.edit(buildTicketPanel(guild, config.ticketPanelStyle || 'button', config.ticketPanelImageURL, config.customTicketCategories)).catch(() => {});
}

const mention = (type, value) => (type === USER ? `<@${value.id}>` : type === ROLE ? `<@&${value.id}>` : type === CHANNEL ? `<#${value.id}>` : String(value));

function asMessage(interaction, args, resolved) {
  const users = new Collection();
  const roles = new Collection();
  const channels = new Collection();
  const members = new Collection();
  for (const item of resolved) {
    if (item.user) { users.set(item.user.id, item.user); if (item.member) members.set(item.user.id, item.member); }
    if (item.role) roles.set(item.role.id, item.role);
    if (item.channel) channels.set(item.channel.id, item.channel);
  }
  const attachments = new Collection(resolved.filter((r) => r.attachment).map((r) => [r.attachment.id, r.attachment]));
  let answered = false;
  let deferTimer = setTimeout(() => { if (!answered && !interaction.deferred && !interaction.replied) interaction.deferReply().catch(() => {}); }, 2000);
  deferTimer.unref?.();

  const reply = async (payload) => {
    clearTimeout(deferTimer);
    const options = typeof payload === 'string' ? { content: payload } : { ...payload };
    delete options.failIfNotExists;
    if (!answered) {
      answered = true;
      if (interaction.deferred && !interaction.replied) return interaction.editReply(options);
      return interaction.reply({ ...options, fetchReply: true });
    }
    return interaction.followUp(options);
  };

  return {
    id: interaction.id,
    client: interaction.client,
    guild: interaction.guild,
    guildId: interaction.guildId,
    channel: interaction.channel,
    channelId: interaction.channelId,
    member: interaction.member,
    author: interaction.user,
    content: `/${interaction.commandName} ${args.join(' ')}`.trim(),
    createdTimestamp: interaction.createdTimestamp,
    attachments,
    mentions: { users, roles, channels, members, everyone: false, repliedUser: null },
    reference: null,
    invokedAs: null,
    interaction,
    reply,
    react: async () => {},
    delete: async () => {},
    fetchReference: async () => null,
  };
}

// Builds the Discord command JSON (name/description/options, with subcommand(-group) nesting)
// from a per-command ROWS table shaped like [subKey, description, options, handler].
function buildData(name, rows, { dm = false } = {}) {
  const entry = { name, description: name, options: [] };
  for (const [subKey, description, options] of rows) {
    const [first, second] = subKey ? subKey.split(' ') : [];
    if (second) {
      let group = entry.options.find((o) => o.type === 2 && o.name === first);
      if (!group) entry.options.push(group = { type: 2, name: first, description: `${first} commands`, options: [] });
      group.options.push({ type: 1, name: second, description, options });
    } else if (first) {
      entry.options.push({ type: 1, name: first, description, options });
    } else {
      entry.options = options;
    }
    entry.description = first ? `${name} commands` : description;
  }
  if (dm) {
    entry.integration_types = [0, 1];
    entry.contexts = [0, 1, 2];
  }
  return entry;
}

// Resolves a chat-input interaction against a per-command ROWS table and runs the matching row:
// either a native handler (above) or a delegation into an existing prefix command.
async function dispatch(interaction, rows) {
  const sub = interaction.options.getSubcommand(false);
  const group = interaction.options.getSubcommandGroup(false);
  const key = [group, sub].filter(Boolean).join(' ');
  const row = rows.find((r) => r[0] === key);
  if (!row) return false;
  const [, , options, handler] = row;

  const given = new Map();
  const resolved = [];
  for (const declared of options) {
    const data = interaction.options.get(declared.name);
    if (!data) continue;
    let value = data.value;
    const entry = {};
    if (data.type === USER) { value = data.user; entry.user = data.user; entry.member = data.member; }
    else if (data.type === ROLE) { value = data.role; entry.role = data.role; }
    else if (data.type === CHANNEL) { value = data.channel; entry.channel = data.channel; }
    else if (data.type === MENTIONABLE) {
      value = data.role || data.user;
      if (data.role) entry.role = data.role; else { entry.user = data.user; entry.member = data.member; }
    } else if (data.type === ATTACHMENT) { value = data.attachment; entry.attachment = data.attachment; }
    given.set(declared.name, { type: data.type, value });
    resolved.push(entry);
  }

  const get = (name) => (given.has(name) ? given.get(name).value : null);
  let args = [];
  if (handler && handler.command) {
    for (const token of handler.tokens) {
      if (!token.startsWith('$')) { args.push(token); continue; }
      const [name, modifier] = token.slice(1).split(':');
      if (!given.has(name)) continue;
      const { type, value } = given.get(name);
      args.push(modifier === 'id' ? value.id : type === ATTACHMENT ? value.url : mention(type, value));
    }
    args = args.join(' ').split(/\s+/).filter(Boolean);
  }
  const message = asMessage(interaction, args, resolved);
  const command = handler && handler.command ? interaction.client.commands.get(handler.command) : null;

  if (!interaction.guild && !(command && command.dmAllowed)) {
    await notice(message, '__This command only works inside a server__');
    return true;
  }
  if (!handler) {
    await missing(message);
  } else if (handler.native) {
    await natives[handler.native](message, get, sub);
  } else {
    if (!command) await missing(message);
    else if (lacksPermission(message, command)) await notice(message, "__You don't have permission__");
    else await command.execute(message, args);
  }
  return true;
}

module.exports = {
  buildData,
  dispatch,
  natives,
  register: (client) => { autoreply.register(client); giveaway.register(client); },
};
