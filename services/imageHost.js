'use strict';
async function uploadToWebhook(blob, name) {
  const webhookUrl = process.env.IMAGE_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('Set IMAGE_WEBHOOK_URL in your .env file first (copy .env.example).');

  const form = new FormData();
  form.append('file', blob, name);

  const hookRes = await fetch(`${webhookUrl}?wait=true`, { method: 'POST', body: form });
  if (!hookRes.ok) throw new Error(`Webhook upload failed (${hookRes.status})`);
  const message = await hookRes.json();
  const url = message.attachments?.[0]?.url;
  if (!url) throw new Error('Webhook response had no attachment URL');
  return url;
}

async function rehostImage(attachment) {
  const sourceRes = await fetch(attachment.url);
  if (!sourceRes.ok) throw new Error(`Failed to download uploaded image (${sourceRes.status})`);
  const blob = await sourceRes.blob();
  return uploadToWebhook(blob, attachment.name || 'image.png');
}

async function hostBuffer(buffer, name = 'image.png') {
  return uploadToWebhook(new Blob([buffer]), name);
}

module.exports = { rehostImage, hostBuffer };
