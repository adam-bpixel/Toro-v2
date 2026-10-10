'use strict';
const { MessagePayload } = require('discord.js');
const { getDb } = require('../core/db');
const { invalidateGuildConfig } = require('../core/moderation');
const { ACCENT_COLOR } = require('../../utils/render/embeds');

const themes = new Map();

const guildConfigs = () => getDb().collection('guildConfig');

async function loadThemes() {
  const docs = await guildConfigs().find({ theme: { $type: 'number' } }, { projection: { guildId: 1, theme: 1 } }).toArray();
  for (const doc of docs) themes.set(doc.guildId, doc.theme);
}

async function saveTheme(guildId, color) {
  if (color === null) {
    await guildConfigs().updateOne({ guildId }, { $unset: { theme: '' } });
    themes.delete(guildId);
  } else {
    await guildConfigs().updateOne({ guildId }, { $set: { theme: color } }, { upsert: true });
    themes.set(guildId, color);
  }
  invalidateGuildConfig(guildId);
}

const themeOf = (guildId) => (guildId && themes.has(guildId) ? themes.get(guildId) : null);

function parseColor(text) {
  const value = String(text).trim();
  let match = value.match(/^(?:#|0x)([0-9a-f]{6})$/i) || value.match(/^([0-9a-f]{6})$/i);
  if (match) return parseInt(match[1], 16);
  if (/^\d{1,8}$/.test(value)) {
    const number = Number(value);
    if (number <= 0xffffff) return number;
  }
  return null;
}

const toHex = (color) => `#${color.toString(16).padStart(6, '0').toUpperCase()}`;

function recolor(value, color) {
  if (Array.isArray(value)) return value.map((item) => recolor(item, color));
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if ((key === 'accent_color' || key === 'color') && item === ACCENT_COLOR) out[key] = color;
    else if (key === 'components' || key === 'embeds') out[key] = recolor(item, color);
    else out[key] = item;
  }
  return out;
}

function installTheme() {
  const original = MessagePayload.prototype.resolveBody;
  if (original.themed) return;
  MessagePayload.prototype.resolveBody = function resolveBody(...args) {
    const result = original.apply(this, args);
    const target = this.target;
    const color = themeOf(target && (target.guildId || (target.guild && target.guild.id)));
    if (color !== null && !(this.options && this.options.noTheme) && this.body) {
      if (this.body.components) this.body.components = recolor(this.body.components, color);
      if (this.body.embeds) this.body.embeds = recolor(this.body.embeds, color);
    }
    return result;
  };
  MessagePayload.prototype.resolveBody.themed = true;
}

module.exports = { loadThemes, saveTheme, themeOf, parseColor, toHex, recolor, installTheme };
