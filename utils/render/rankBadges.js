'use strict';
const path = require('path');
const { loadImage } = require('./canvas');

const BADGES_DIR = path.join(__dirname, '..', '..', 'data', 'badges');

const TIERS = [
  { name: 'Grandmaster', from: 75, file: 'grandmaster.png' },
  { name: 'Diamond', from: 50, file: 'diamond.png' },
  { name: 'Platinum', from: 30, file: 'platinum.png' },
  { name: 'Gold', from: 15, file: 'gold.png' },
  { name: 'Silver', from: 5, file: 'silver.png' },
  { name: 'Bronze', from: 0, file: 'bronze.png' },
];

const tierOf = (level) => TIERS.find((tier) => level >= tier.from);

const images = new Map();
function badgeImage(tier) {
  if (!images.has(tier.file)) {
    images.set(tier.file, loadImage(path.join(BADGES_DIR, tier.file)).catch((error) => {
      console.error(`Rank badge ${tier.file} not loaded: ${error.message}`);
      images.delete(tier.file);
      return null;
    }));
  }
  return images.get(tier.file);
}

module.exports = { TIERS, tierOf, badgeImage };
