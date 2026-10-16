'use strict';
const path = require('node:path');
const { loadImage } = require('../utils/render/canvas');

const MANIFEST = path.join(__dirname, '..', 'data', 'hosted-assets.json');

const images = new Map();

async function download(file) {
  const urls = require(MANIFEST);
  if (!urls[file]) return null;
  const res = await fetch(urls[file]);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  return loadImage(Buffer.from(await res.arrayBuffer()));
}

function assetImage(file) {
  if (!images.has(file)) {
    images.set(file, download(file).catch((error) => {
      console.error(`Hosted asset ${file} not loaded: ${error.message}`);
      images.delete(file);
      return null;
    }));
  }
  return images.get(file);
}

module.exports = { assetImage, MANIFEST };
