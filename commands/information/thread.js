'use strict';
const { notice, usageCard } = require('../../utils/render/embeds');
const { getDb } = require('../../models/core/db');
const { buildXPostCard } = require('../../utils/render/cards');
const { comma } = require('../../utils/format');
const { AttachmentBuilder } = require('discord.js');

const threads = () => getDb().collection('threadPosts');

module.exports = {
  name: 'thread',
  aliases: [],
  description: 'Create a simulated X (Twitter) thread post',
  usage: '<text>',
  category: 'Information Commands',
  threads,
  async execute(message, args) {
    const text = args.join(' ').trim();
    if (!text) return usageCard(message, { summary: 'Create a simulated X thread post', usage: '&thread <text>' });
    if (text.length > 500) return notice(message, '__A thread post can be 500 characters at most__');

    const user = message.author;
    const likes = Math.floor(Math.random() * 9000) + 20;
    const replies = Math.floor(Math.random() * 400);
    const reposts = Math.floor(Math.random() * 900);
    const name = (message.member && message.member.displayName) || user.username;
    const handle = user.username;

    await threads().insertOne({
      guildId: message.guild ? message.guild.id : null,
      userId: user.id,
      username: user.username,
      content: text,
      likes,
      replies,
      reposts,
      createdAt: new Date(),
    }).catch(() => {});

    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
    const buffer = await buildXPostCard({ avatarURL, name, handle, text, likes, replies, reposts });
    const attachment = new AttachmentBuilder(buffer, { name: 'thread.png' });

    await message.channel.send({ files: [attachment], allowedMentions: { parse: [] } });
    if (message.deletable) message.delete().catch(() => {});
  },
};
