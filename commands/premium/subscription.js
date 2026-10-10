const { resolveUser } = require('../../utils/access/resolve');
const { isOwner, getSubscription } = require('../../models/economy/premium');
const { subscriptionStatus, subscriptionLines, subscriptionBlock, subscriptionCard } = require('../../utils/render/subscriptionCard');

module.exports = {
  name: 'subscription',
  aliases: [],
  description: 'Show the premium subscription of a user or of this server',
  usage: '[user|server] [ID|@member|username]',
  category: 'Premium Commands',
  async execute(message, args) {
    const first = (args[0] || '').toLowerCase();

    if (first === 'server') {
      if (!message.guild) return message.reply({ content: '__This can only be used in a server__', allowedMentions: { repliedUser: false } });
      const subscription = await getSubscription('server', message.guild.id);
      const lines = [`- __Status__  ${subscriptionStatus(subscription)}`, ...subscriptionLines(subscription)];
      const guild = await message.guild.fetch().catch(() => message.guild);
      const image = guild.iconURL({ extension: 'png', size: 512 }) || message.client.user.displayAvatarURL({ extension: 'png', size: 512 });
      return message.reply(subscriptionCard([subscriptionBlock('Server Subscription Stats', image, lines)]));
    }

    const target = await resolveUser(message, first === 'user' ? args.slice(1) : args);
    const owner = isOwner(target.id);
    const subscription = await getSubscription('user', target.id);
    const lines = [`- __Status__  ${subscriptionStatus(subscription, { owner })}`, ...subscriptionLines(subscription, { owner })];
    return message.reply(subscriptionCard([subscriptionBlock('User Subscription Stats', target.displayAvatarURL({ extension: 'png', size: 512 }), lines)]));
  },
};
