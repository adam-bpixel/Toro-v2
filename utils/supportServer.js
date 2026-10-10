'use strict';
const ORIGINAL_URL = 'https://discord.gg/EVJNa3SRD7';

function normalize(input) {
  const text = String(input || '').trim().replace(/^<|>$/g, '');
  const match = text.match(/^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([A-Za-z0-9_-]+)\/?$/i)
    || text.match(/^([A-Za-z0-9_-]{2,32})$/);
  return match ? `https://discord.gg/${match[1]}` : null;
}

const supportServerUrl = () => normalize(process.env.SUPPORT_SERVER) || ORIGINAL_URL;

const withSupportServer = (text) => (typeof text === 'string' && text.includes(ORIGINAL_URL) ? text.split(ORIGINAL_URL).join(supportServerUrl()) : text);

module.exports = { ORIGINAL_URL, supportServerUrl, withSupportServer, normalize };
