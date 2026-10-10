'use strict';

const WEBHOOK_ENV_VARS = ['GLOBAL_LOGS_WEBHOOK_URL', 'IMAGE_WEBHOOK_URL'];

async function updateWebhook(url, name, avatarDataUri) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, avatar: avatarDataUri }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function syncWebhookBranding(client) {
  const name = client.user.username;
  const avatarURL = client.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarResponse = await fetch(avatarURL);
  if (!avatarResponse.ok) throw new Error(`Could not download the bot avatar (HTTP ${avatarResponse.status})`);
  const buffer = Buffer.from(await avatarResponse.arrayBuffer());
  const avatarDataUri = `data:image/png;base64,${buffer.toString('base64')}`;

  const urls = WEBHOOK_ENV_VARS.map((key) => process.env[key]).filter(Boolean);
  if (!urls.length) return;

  for (const url of urls) {
    await updateWebhook(url, name, avatarDataUri).catch((error) => {
      console.error('Could not update webhook branding:', error.message);
    });
  }
}

module.exports = { syncWebhookBranding };
