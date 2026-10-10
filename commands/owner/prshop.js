'use strict';
const { card, notice, usageCard } = require('../../utils/render/embeds');
const { isOwner } = require('../../models/economy/premium');
const { getProfile, setShopListing, updateShopField, removeShopListing } = require('../../models/economy/profiles');
const { parseAmount, comma } = require('../../utils/format');
const { EMOJI } = require('../../utils/emojis');

const FIELDS = ['name', 'price', 'stock'];

const readStock = (raw) => (raw.toLowerCase() === 'unlimited' || raw === '-1' ? -1 : parseAmount(raw));
const stockText = (stock) => (stock === -1 ? '__Unlimited__' : `\`${stock}\``);

module.exports = {
  name: 'prshop',
  aliases: [],
  description: 'Add, edit or remove a profile background in the shop',
  usage: 'add|edit|remove ...',
  category: 'Owner Commands',
  async execute(message, args) {
    if (!isOwner(message.author.id)) return notice(message, '__Only the bot owner can use this command__');

    const usage = () => usageCard(message, {
      summary: 'Add, edit or remove a profile background in the shop',
      usage: '&prshop <add|edit|remove> ...',
      notes: [
        '`&prshop add <profile id> <name> <price> <stock>`',
        '`&prshop edit <profile id> <name|price|stock> <value>`',
        '`&prshop remove <profile id>`',
        '`stock` can be a number, or `unlimited`',
      ],
    });

    const sub = (args[0] || '').toLowerCase();
    if (sub === 'add') return handleAdd(message, args);
    if (sub === 'edit') return handleEdit(message, args);
    if (sub === 'remove') return handleRemove(message, args);
    return usage();
  },
};

async function handleAdd(message, args) {
  const usage = () => usageCard(message, {
    summary: 'Add (or reconfigure) a profile background in the shop',
    usage: '&prshop add <profile id> <name> <price> <stock>',
    notes: ['`stock` can be a number, or `unlimited`'],
  });
  if (args.length < 5) return usage();

  const profileId = Number(args[1]);
  const stockRaw = args[args.length - 1];
  const priceRaw = args[args.length - 2];
  const name = args.slice(2, args.length - 2).join(' ').trim();
  if (!Number.isInteger(profileId) || !name) return usage();

  const profile = await getProfile(profileId);
  if (!profile) return notice(message, '__No profile background with that ID__');

  const price = parseAmount(priceRaw);
  if (price === null) return notice(message, '__Invalid price__');
  const stock = readStock(stockRaw);
  if (stock === null) return notice(message, '__Invalid stock - a number, or `unlimited`__');

  await setShopListing(profileId, { name, price, stock });
  return card(message, {
    title: `${EMOJI.box} Shop Updated`,
    lines: [
      `__Profile__ : **#${profileId}**`,
      `__Name__ : \`${name}\``,
      `__Price__ : \`${comma(price)}\` ${EMOJI.coin}`,
      `__Stock__ : ${stockText(stock)}`,
    ],
  });
}

async function handleEdit(message, args) {
  const usage = () => usageCard(message, {
    summary: "Change one field of a profile's shop listing",
    usage: '&prshop edit <profile id> <name|price|stock> <value>',
    notes: ['`stock` can be a number, or `unlimited`'],
  });

  const profileId = Number(args[1]);
  const field = (args[2] || '').toLowerCase();
  const rawValue = args.slice(3).join(' ').trim();
  if (!Number.isInteger(profileId) || !FIELDS.includes(field) || !rawValue) return usage();

  const profile = await getProfile(profileId);
  if (!profile) return notice(message, '__No profile background with that ID__');
  if (profile.name === null) return notice(message, "__That profile isn't in the shop yet - use__ `&prshop add` __first__");

  let value;
  if (field === 'name') value = rawValue;
  else if (field === 'price') value = parseAmount(rawValue);
  else value = readStock(rawValue);
  if (value === null) return notice(message, `__Invalid ${field}__`);

  await updateShopField(profileId, field, value);
  const shown = field === 'price' ? `\`${comma(value)}\` ${EMOJI.coin}` : field === 'stock' ? stockText(value) : `\`${value}\``;
  return card(message, {
    title: `${EMOJI.box} Shop Updated`,
    lines: [`__Profile__ : **#${profileId}**`, `__${field[0].toUpperCase()}${field.slice(1)}__ : ${shown}`],
  });
}

async function handleRemove(message, args) {
  const profileId = Number(args[1]);
  if (!Number.isInteger(profileId)) {
    return usageCard(message, { summary: 'Remove a profile background from the shop', usage: '&prshop remove <profile id>' });
  }

  const profile = await getProfile(profileId);
  if (!profile) return notice(message, '__No profile background with that ID__');
  if (profile.name === null) return notice(message, "__That profile isn't in the shop__");

  await removeShopListing(profileId);
  return card(message, {
    title: `${EMOJI.box} Removed From Shop`,
    lines: [`__**#${profileId}** (${profile.name}) is no longer in the shop__`, '__It stays in the catalog and anyone who already owns it keeps it__'],
  });
}
