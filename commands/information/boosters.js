'use strict';
const { ComponentType } = require('discord.js');
const { COMPONENTS_V2, ACCENT_COLOR, notice } = require('../../utils/render/embeds');
const { disablePanelMessage } = require('../../utils/runtime/panels');
const activeComponents = require('../../utils/runtime/activeComponents');
const { SETUP_EMOJI, SERVER_EMOJI, HONEYPOT_EMOJI, BOOSTERS_EMOJI } = require('../../utils/emojis');

const ID = '1398395532103254157';
const HOWTO_BUTTON_ID = `boosters_howto_${ID}`;
const IDLE_MS = 5 * 60 * 1000;
const EPHEMERAL = 1 << 6;
const HOWTO_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1553531361329938523/1559608558876754000/boosters_howto.png?ex=6acfb228&is=6ace60a8&hm=a76d0950362889abb2b0e8fc45ed0f6e2126b0711de34f7db81c5b8c01507e4d&';

const divider = () => ({ type: 14, spacing: 1, divider: true });

function buildPanel(guild, requesterName) {
  const boosterRole = guild.roles.premiumSubscriberRole;
  const level = guild.premiumTier || 0;
  const count = guild.premiumSubscriptionCount || 0;

  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `## ${BOOSTERS_EMOJI.header} ${guild.name} Boosters` },
        divider(),
        {
          type: 10,
          content: boosterRole
            ? `-# ${SETUP_EMOJI.dropdown} __Click ${boosterRole} to see all boosters • Hover the ${SERVER_EMOJI.boost} icon on a member to see their boosting since date__`
            : `-# ${SETUP_EMOJI.dropdown} __Hover the ${SERVER_EMOJI.boost} icon on a member to see their boosting since date__`,
        },
        divider(),
        {
          type: 10,
          content: [
            `- __Boost Level__ : **Level ${level}**  ⁘`,
            `- __Boost Count__ : **${count}**  ⁘`,
            `- __Boost Role__ : ${boosterRole ? `${boosterRole}` : '`None`'}  ⁘`,
          ].join('\n'),
        },
        divider(),
        { type: 1, components: [{ type: 2, custom_id: HOWTO_BUTTON_ID, style: 2, label: 'How to see boosting since' }] },
        divider(),
        { type: 10, content: `-# ${HONEYPOT_EMOJI.brand} • Boosters Requested by ${requesterName}` },
      ],
      spoiler: false,
    }],
  };
}

function buildHowTo() {
  return {
    flags: COMPONENTS_V2 | EPHEMERAL,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: '## Server Boosting Since' },
        divider(),
        { type: 10, content: '- __Move your mouse pointer directly over that crystal icon. A small tooltip box will appear displaying the text : **"Server Boosting since"**__  ⁘' },
        divider(),
        { type: 12, items: [{ media: { url: HOWTO_IMAGE_URL }, description: 'Hover the boost icon to see boosting since date', spoiler: false }] },
      ],
      spoiler: false,
    }],
  };
}

module.exports = {
  name: 'boosters',
  aliases: [],
  description: "Show the server's boost status and role",
  usage: '',
  category: 'Information Commands',
  async execute(message) {
    if (!message.guild) return notice(message, '__This command only works inside a server__');

    const sent = await message.reply({ ...buildPanel(message.guild, message.author.username), allowedMentions: { parse: [] } });
    activeComponents.claim(sent.id);

    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, idle: IDLE_MS });
    collector.on('collect', async (interaction) => {
      if (interaction.customId !== HOWTO_BUTTON_ID) return;
      await interaction.reply(buildHowTo()).catch(() => {});
    });

    collector.on('end', async () => {
      activeComponents.release(sent.id);
      if (message.guild) await disablePanelMessage(message.guild, sent.channelId, sent.id);
    });
  },
};
