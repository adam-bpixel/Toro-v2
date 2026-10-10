'use strict';
const { getDb } = require('./db');

const state = () => getDb().collection('botState');
const DOC_ID = 'workmode';

let cached = false;
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  const doc = await state().findOne({ _id: DOC_ID });
  cached = Boolean(doc && doc.enabled);
  loaded = true;
}

const isWorkMode = () => cached;

async function setWorkMode(enabled) {
  cached = enabled;
  loaded = true;
  await state().updateOne({ _id: DOC_ID }, { $set: { enabled } }, { upsert: true });
}

module.exports = { ensureLoaded, isWorkMode, setWorkMode };
