'use strict';
const fs = require('fs');
const path = require('path');
const gradient = require('gradient-string');

const pinkGradient = gradient(['#ff9fd6', '#ff4fa3', '#ff1493']);
const row = (label, value) => console.log(`${pinkGradient(`${label.padEnd(15)} : `)}${pinkGradient(String(value))}`);

const SOURCE_FILE = path.join(__dirname, '..', 'utils', 'emojis.js');
const MAP_FILE = path.join(__dirname, '..', 'data', 'emoji-map.json');
const BOT_LOGO_EMOJI_ID = '1551750443221393448';

function collectEmojis() {
  const source = fs.readFileSync(SOURCE_FILE, 'utf8');
  const found = new Map();
  for (const match of source.matchAll(/<(a?):([^:>]+):(\d+)>/g)) {
    const [, anim, name, id] = match;
    if (!found.has(id)) found.set(id, { name, animated: anim === 'a' });
  }
  for (const match of source.matchAll(/\{\s*name:\s*'([^']+)',\s*id:\s*'(\d+)'\s*\}/g)) {
    const [, name, id] = match;
    if (!found.has(id)) found.set(id, { name, animated: false });
  }
  return found;
}

async function syncEmojis(client) {
  if (process.env.SYNC_EMOJIS !== 'true') return;

  const map = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};
  const emojis = [...collectEmojis()].filter(([id]) => !map[id]);
  if (!emojis.length) {
    row('Emoji sync', 'skipped, nothing new to sync');
    return;
  }

  const existing = await client.application.emojis.fetch().catch(() => null);
  const existingByName = new Map((existing ? [...existing.values()] : []).map((e) => [e.name, e.id]));

  let done = 0;
  row('Emoji sync', `syncing ${emojis.length} new emoji to this bot's application...`);

  for (const [id, { name, animated }] of emojis) {
    const already = existingByName.get(name);
    if (already) {
      map[id] = already;
      done += 1;
      continue;
    }
    try {
      const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const created = await client.application.emojis.create({ name, attachment: buffer });
      map[id] = created.id;
      done += 1;
    } catch (error) {
      console.error(`Could not upload emoji "${name}" (${id}):`, error.message);
    }
  }

  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
  if (done > 0) {
    row('Emoji sync', `done, ${done}/${emojis.length} uploaded - restarting bot to apply...`);
    setTimeout(() => process.exit(0), 500);
  } else {
    row('Emoji sync', `done, 0/${emojis.length} uploaded (check errors above)`);
  }
}

function maskCircle(bitmap) {
  const { width, height, data } = bitmap;
  const cx = width / 2, cy = height / 2;
  const r = Math.min(width, height) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r * r) data[(y * width + x) * 4 + 3] = 0;
    }
  }
}

async function circleCroppedStatic(avatarURL, size) {
  const { loadImage, createCanvas } = require('@napi-rs/canvas');
  const img = await loadImage(avatarURL);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toBuffer('image/png');
}

async function circleCroppedGif(avatarURL) {
  const { GifCodec } = require('gifwrap');
  const codec = new GifCodec();
  const response = await fetch(avatarURL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const gif = await codec.decodeGif(Buffer.from(await response.arrayBuffer()));
  for (const frame of gif.frames) maskCircle(frame.bitmap);
  const encoded = await codec.encodeGif(gif.frames, { loops: 0 });
  return encoded.buffer;
}

async function syncBotAvatarLogo(client) {
  if (process.env.USE_BOT_AVATAR_LOGO !== 'true') return;

  const map = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};
  const avatarHash = client.user.avatar;
  const current = map[BOT_LOGO_EMOJI_ID];
  const currentId = current && typeof current === 'object' ? current.id : current;
  if (current && typeof current === 'object' && current.avatarHash === avatarHash) return;

  const size = 256;
  const animated = (avatarHash || '').startsWith('a_');
  const avatarURL = client.user.displayAvatarURL({ extension: animated ? 'gif' : 'png', size });
  const buffer = animated ? await circleCroppedGif(avatarURL) : await circleCroppedStatic(avatarURL, size);

  if (currentId) await client.application.emojis.delete(currentId).catch(() => {});

  const created = await client.application.emojis.create({ name: 'torocc', attachment: buffer });
  map[BOT_LOGO_EMOJI_ID] = { id: created.id, animated, avatarHash };
  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
  row('Bot avatar logo', currentId ? 'updated after an avatar change - restart the bot once to use it everywhere' : 'created - restart the bot once to use it everywhere');
}

module.exports = { syncEmojis, syncBotAvatarLogo };
