'use strict';
const { container, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { getGuildConfig, setAzkarLastSent, getAllAzkarConfigs } = require('../../models/core/moderation');

const HOUR_MS = 60 * 60 * 1000;
const timers = new Map();

const AZKAR_API_URL = 'https://www.hisnmuslim.com/api/ar/27.json';
const FALLBACK_AZKAR = [
  'سبحان الله وبحمده، سبحان الله العظيم',
  'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',
  'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه',
  'اللهم صل وسلم على نبينا محمد',
  'لا حول ولا قوة إلا بالله',
  'حسبنا الله ونعم الوكيل',
];
let azkarList = FALLBACK_AZKAR;

async function loadAzkarList() {
  try {
    const res = await fetch(AZKAR_API_URL);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = JSON.parse((await res.text()).replace(/^\uFEFF/, ''));
    const texts = Object.values(data)[0].map((item) => item.ARABIC_TEXT).filter(Boolean);
    if (texts.length) azkarList = texts;
  } catch (error) {
    console.error('Could not load Azkar from the free API, using the built-in list:', error.message);
  }
}

const pick = () => azkarList[Math.floor(Math.random() * azkarList.length)];

function azkarPayload() {
  return {
    flags: COMPONENTS_V2,
    components: [container({ title: '📿 Azkar', lines: [`__${pick()}__`] })],
    allowedMentions: { parse: [] },
  };
}

async function sendAndReschedule(client, guildId) {
  const config = await getGuildConfig(guildId);
  const settings = config.azkar;
  if (!settings || !settings.channelId) return;
  const guild = client.guilds.cache.get(guildId);
  const channel = guild && guild.channels.cache.get(settings.channelId);
  if (channel) await channel.send(azkarPayload()).catch(() => {});
  await setAzkarLastSent(guildId, new Date());
  schedule(client, guildId, settings.intervalHours);
}

function schedule(client, guildId, intervalHours, delayMs = intervalHours * HOUR_MS) {
  clearTimeout(timers.get(guildId));
  const timer = setTimeout(() => sendAndReschedule(client, guildId).catch(() => {}), Math.max(delayMs, 1000));
  timer.unref();
  timers.set(guildId, timer);
}

async function registerAzkar(client) {
  await loadAzkarList();
  const configs = await getAllAzkarConfigs().catch(() => []);
  for (const { guildId, intervalHours, lastSentAt } of configs) {
    const elapsed = lastSentAt ? Date.now() - new Date(lastSentAt).getTime() : Infinity;
    const delay = Math.max(intervalHours * HOUR_MS - elapsed, 0);
    schedule(client, guildId, intervalHours, delay);
  }
}

const triggerAzkarNow = (client, guildId) => sendAndReschedule(client, guildId);

function cancelAzkar(guildId) {
  clearTimeout(timers.get(guildId));
  timers.delete(guildId);
}

module.exports = { registerAzkar, triggerAzkarNow, cancelAzkar };
