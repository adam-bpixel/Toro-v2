'use strict';
const last = new Map();

function hit(key, ms) {
  const now = Date.now();
  const at = last.get(key) || 0;
  const remaining = at + ms - now;
  if (remaining > 0) return { onCooldown: true, remainingMs: remaining };
  last.set(key, now);
  return { onCooldown: false, remainingMs: 0 };
}

function peek(key, ms) {
  const remaining = (last.get(key) || 0) + ms - Date.now();
  return remaining > 0 ? { onCooldown: true, remainingMs: remaining } : { onCooldown: false, remainingMs: 0 };
}

function start(key) {
  last.set(key, Date.now());
}

module.exports = { hit, peek, start };
