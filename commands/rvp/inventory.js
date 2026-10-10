const { getUser, claimDaily, setAvatarShape, setEquippedProfile, getActiveCard } = require('../../models/economy/economy');
const { ownedProfiles, shopListings, buyProfile } = require('../../models/economy/profiles');
const { payloadOf, COMPONENTS_V2, ACCENT_COLOR, textBlock, divider, bullet } = require('../../utils/render/embeds');
const { comma, duration } = require('../../utils/format');
const activeComponents = require('../../utils/runtime/activeComponents');
const { EMOJI } = require('../../utils/emojis');
const { parseEmoji } = require('../../handlers/ticketPanel');

const mainRow1 = () => ({
  type: 1,
  components: [
    { type: 2, style: 2, custom_id: 'inv_profiles', label: 'Profiles', emoji: { id: '1551750407519207426', name: 'box' } },
    { type: 2, style: 2, custom_id: 'inv_balance', label: 'Balance', emoji: { id: '1551750396223955005', name: 'rvpcoins' } },
    { type: 2, style: 2, custom_id: 'inv_daily', label: 'Daily', emoji: { id: '1551750411986149386', name: 'gift' } },
    { type: 2, style: 2, custom_id: 'inv_cards', label: 'Cards', emoji: { id: '1551750416444956702', name: 'cardvw' } },
  ],
});
const mainRow2 = () => ({ type: 1, components: [{ type: 2, style: 2, custom_id: 'inv_shape', label: 'Profile Shape' }] });
const EPHEMERAL = 1 << 6;

function mainPayload() {
  const parts = [
    { type: 10, content: `## ${EMOJI.inventory} Your inventory` },
    { type: 14, spacing: 1, divider: true },
    { type: 10, content: 'From this section, you can browse your inventory: items you own, your balance, your daily reward and active XP boost cards.' },
    { type: 14, spacing: 1, divider: true },
    mainRow1(),
    mainRow2(),
  ];
  return { flags: COMPONENTS_V2, components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }] };
}

async function balanceView(userId) {
  const user = await getUser(userId);
  return payloadOf({
    title: 'Inventory - RVP Balance',
    lines: [
      `__Balance__ : \`${comma(user.balance)}\` ${EMOJI.coin}`,
      `__Streak__ : \`${user.dailyStreak} day${user.dailyStreak === 1 ? '' : 's'}\``,
      user.lastDaily ? `__Last Daily__ : <t:${Math.floor(new Date(user.lastDaily).getTime() / 1000)}:R>` : '__Last Daily__ : never',
    ],
  });
}

async function dailyView(userId) {
  const result = await claimDaily(userId);
  const lines = result.ok
    ? [
        `__Claimed__ : \`+${comma(result.amount)}\` ${EMOJI.coin} ${EMOJI.success}`,
        `__Streak__ : \`${result.streak} day${result.streak === 1 ? '' : 's'}\``,
      ]
    : ['__Already claimed today__', `__Next claim in ${Math.ceil(result.remainingMs / 3600000)}h__`];
  return payloadOf({ title: 'Daily Reward', lines });
}

async function cardsView(userId) {
  const active = await getActiveCard(userId);
  const lines = active
    ? [
        `__Active__ : \`+${Math.round((active.multiplier - 1) * 100)}%\` __XP boost__`,
        `__Expires in__ : \`${duration(active.expiresAt.getTime() - Date.now())}\``,
      ]
    : ['__You have no active XP boost cards__'];
  return payloadOf({ title: `${EMOJI.card} Cards`, lines });
}

async function loadProfilesState(userId) {
  const [user, owned, shop] = await Promise.all([getUser(userId), ownedProfiles(userId), shopListings()]);
  const ownedIds = new Set(owned.map((p) => p.profileId));
  const buyable = shop.filter((p) => !ownedIds.has(p.profileId) && p.stock !== 0).slice(0, 25);
  const entries = [
    { id: null, name: 'Default', imageUrl: null },
    ...owned.map((p) => ({ id: p.profileId, name: p.name || `Profile ${p.profileId}`, imageUrl: p.previewUrl || p.imageUrl })),
  ];
  return { entries, equippedId: user.equippedProfileId, buyable };
}

function buildProfilesPage({ entries, equippedId, buyable }, page, notice = null) {
  const pages = entries.length;
  const clamped = Math.min(Math.max(page, 0), pages - 1);
  const entry = entries[clamped];
  const isEquipped = entry.id === equippedId;

  const parts = [textBlock(`## Inventory - Profiles - Page ${clamped + 1}/${pages}`), divider()];
  if (notice) parts.push(textBlock(bullet(notice)), divider());
  parts.push(textBlock(`**${entry.name}**${entry.id !== null ? ` | ${EMOJI.box} ${entry.id}` : ''}`));
  if (entry.imageUrl) parts.push({ type: 12, items: [{ media: { url: entry.imageUrl }, description: entry.name, spoiler: false }] });
  parts.push(
    divider(),
    {
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: 'inv_profile_prev', emoji: parseEmoji(EMOJI.left), disabled: clamped === 0 },
        { type: 2, style: 2, custom_id: 'inv_profile_next', emoji: parseEmoji(EMOJI.right), disabled: clamped >= pages - 1 },
        {
          type: 2,
          style: 2,
          custom_id: `inv_profile_equip_${entry.id === null ? 'none' : entry.id}`,
          label: isEquipped ? 'Equipped' : 'Equip',
          disabled: isEquipped,
        },
      ],
    },
  );

  if (buyable.length) {
    parts.push(divider(), {
      type: 1,
      components: [{
        type: 3,
        custom_id: 'inv_profile_buy',
        placeholder: 'Buy a background',
        min_values: 1,
        max_values: 1,
        options: buyable.map((p) => ({
          label: p.name.slice(0, 100),
          value: String(p.profileId),
          description: `${comma(p.price)} RVP${p.stock === -1 ? '' : ` - ${p.stock} left`}`.slice(0, 100),
        })),
      }],
    });
  }

  return { flags: COMPONENTS_V2, components: [{ type: 17, accent_color: ACCENT_COLOR, components: parts, spoiler: false }] };
}

function shapeView(shape, justSet = false) {
  const options = [
    { label: 'Circle', value: 'circle', description: 'Round avatar with decoration support', default: shape === 'circle' },
    { label: 'Square', value: 'square', description: 'Square avatar, no decoration overlay', default: shape === 'square' },
  ];
  const lines = justSet ? [`${EMOJI.success} __Success! Avatar shape set to **${shape}**__`] : [];
  lines.push(`__Current shape : **${shape}**__`, '__**Circle** — Round avatar__', '__**Square** — Rounded square avatar__');
  return payloadOf({
    title: 'Inventory - Avatar Shape',
    lines,
    extraRows: [
      { type: 1, components: [{ type: 3, custom_id: 'inv_shape_select', placeholder: shape === 'circle' ? 'Circle' : 'Square', min_values: 1, max_values: 1, options }] },
    ],
  });
}

module.exports = {
  name: 'inventory',
  aliases: ['inv'],
  description: 'View your inventory with profiles and balance',
  usage: '',
  category: 'Rvp System',
  async execute(message) {
    const sent = await message.reply({ ...mainPayload(), allowedMentions: { repliedUser: true } });
    activeComponents.claim(sent.id);

    const collector = sent.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 5 * 60 * 1000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return;
      try {
        const id = interaction.customId;
        if (id === 'inv_balance') return await interaction.reply({ ...(await balanceView(message.author.id)), flags: COMPONENTS_V2 | EPHEMERAL });
        if (id === 'inv_daily') return await interaction.reply({ ...(await dailyView(message.author.id)), flags: COMPONENTS_V2 | EPHEMERAL });
        if (id === 'inv_cards') return await interaction.reply({ ...(await cardsView(message.author.id)), flags: COMPONENTS_V2 | EPHEMERAL });
        if (id === 'inv_profiles') {
          let page = 0;
          const state = await loadProfilesState(message.author.id);
          await interaction.reply({ ...buildProfilesPage(state, page), flags: COMPONENTS_V2 | EPHEMERAL });
          const profilesMessage = await interaction.fetchReply();
          activeComponents.claim(profilesMessage.id);
          const profilesCollector = profilesMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id && (
              i.customId.startsWith('inv_profile_equip_') || i.customId === 'inv_profile_buy'
              || i.customId === 'inv_profile_prev' || i.customId === 'inv_profile_next'
            ),
            time: 5 * 60 * 1000,
          });
          profilesCollector.on('end', () => activeComponents.release(profilesMessage.id));
          profilesCollector.on('collect', async (i) => {
            if (i.replied || i.deferred) return;
            try {
              if (i.customId === 'inv_profile_prev' || i.customId === 'inv_profile_next') {
                page += i.customId === 'inv_profile_next' ? 1 : -1;
                return await i.update(buildProfilesPage(await loadProfilesState(message.author.id), page));
              }
              if (i.customId === 'inv_profile_buy') {
                const result = await buyProfile(message.author.id, Number(i.values[0]));
                const notice = result.ok ? `${EMOJI.success} __Bought and equipped__ **${result.profile.name}**` : result.notice;
                return await i.update(buildProfilesPage(await loadProfilesState(message.author.id), page, notice));
              }
              const raw = i.customId.slice('inv_profile_equip_'.length);
              await setEquippedProfile(message.author.id, raw === 'none' ? null : Number(raw));
              return await i.update(buildProfilesPage(await loadProfilesState(message.author.id), page, `${EMOJI.success} __Background updated__`));
            } catch (error) {
              console.error('Inventory profile interaction failed:', error);
            }
          });
          return;
        }
        if (id === 'inv_shape') {
          const user = await getUser(message.author.id);
          await interaction.reply({ ...shapeView(user.avatarShape), flags: COMPONENTS_V2 | EPHEMERAL });
          const shapeMessage = await interaction.fetchReply();
          activeComponents.claim(shapeMessage.id);
          const shapeCollector = shapeMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id && i.customId === 'inv_shape_select',
            time: 5 * 60 * 1000,
          });
          shapeCollector.on('end', () => activeComponents.release(shapeMessage.id));
          shapeCollector.on('collect', async (i) => {
            if (i.replied || i.deferred) return;
            try {
              const shape = i.values[0];
              await setAvatarShape(message.author.id, shape);
              await i.update(shapeView(shape, true));
            } catch (error) {
              console.error('Inventory shape interaction failed:', error);
            }
          });
        }
      } catch (error) {
        console.error('Inventory interaction failed:', error);
      }
    });

    collector.on('end', () => activeComponents.release(sent.id));
  },
};
