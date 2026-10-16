'use strict';

const comma = (n) => Math.trunc(n).toLocaleString('en-US');

const compact = (n) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

function duration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

function parseAmount(input, balance = Infinity) {
  if (!input) return null;
  const raw = String(input).trim().toLowerCase();
  if (raw === 'all' || raw === 'max') return balance === Infinity ? null : Math.trunc(balance);
  const match = raw.match(/^(\d+(?:\.\d+)?)(k|m|b)?$/);
  if (!match) return null;
  const scale = { k: 1e3, m: 1e6, b: 1e9 }[match[2]] || 1;
  const amount = Math.trunc(parseFloat(match[1]) * scale);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseDuration(input) {
  const match = String(input || '').trim().match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!match) return null;
  const scale = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 }[match[2].toLowerCase()];
  return Number(match[1]) * scale;
}

module.exports = { comma, compact, duration, parseAmount, parseDuration };
