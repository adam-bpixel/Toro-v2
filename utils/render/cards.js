'use strict';
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { tierOf, badgeImage } = require('./rankBadges');
const { assetImage } = require('../../services/assetHost');
const { compact, comma, duration } = require('../format');

const CARD_QUALITY = 90;

const ACCENT = '#d4c7d6';
const BAR_FILL = '#9aa0ab';
const BG_TOP = '#0c0f1a';
const BG_BOTTOM = '#151a2c';
const MUTED = '#8b93a7';
const FONT = '"Segoe UI", "Noto Sans", "DejaVu Sans", Arial, sans-serif';

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function paintBackgroundGradientFallback(ctx, w, h) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glowA = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, w * 0.55);
  glowA.addColorStop(0, 'rgba(212, 199, 214, 0.22)');
  glowA.addColorStop(1, 'rgba(212, 199, 214, 0)');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, w, h);

  const glowB = ctx.createRadialGradient(w * 0.1, h * 0.95, 0, w * 0.1, h * 0.95, w * 0.5);
  glowB.addColorStop(0, 'rgba(120, 160, 200, 0.18)');
  glowB.addColorStop(1, 'rgba(120, 160, 200, 0)');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  for (let i = -h; i < w; i += 46) {
    ctx.beginPath();
    ctx.moveTo(i, h);
    ctx.lineTo(i + h, 0);
    ctx.stroke();
  }
  ctx.restore();
}

let profileBgPromise = null;
function loadProfileBackground() {
  if (!profileBgPromise) profileBgPromise = assetImage('profile_bg.png');
  return profileBgPromise;
}

async function paintBackground(ctx, w, h, backgroundURL) {
  const bg = backgroundURL ? await loadImage(backgroundURL).catch(() => null) : await loadProfileBackground();
  if (!bg) return paintBackgroundGradientFallback(ctx, w, h);
  drawImageCover(ctx, bg, w, h);

  ctx.fillStyle = 'rgba(6, 8, 14, 0.28)';
  ctx.fillRect(0, 0, w, h);

  const leftShade = ctx.createLinearGradient(0, 0, w * 0.62, 0);
  leftShade.addColorStop(0, 'rgba(4, 5, 10, 0.48)');
  leftShade.addColorStop(1, 'rgba(4, 5, 10, 0)');
  ctx.fillStyle = leftShade;
  ctx.fillRect(0, 0, w, h);
}

async function drawAvatar(ctx, url, x, y, size, radius, shape = 'square') {
  ctx.save();
  if (shape === 'circle') {
    const cx = x + size / 2, cy = y + size / 2, r = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
  } else {
    roundedRectPath(ctx, x - 2, y - 2, size + 4, size + 4, radius + 2);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;
    ctx.stroke();
    roundedRectPath(ctx, x, y, size, size, radius);
    ctx.clip();
  }
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, x, y, size, size);
  } catch {
    ctx.fillStyle = '#242a3d';
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

const RANK_BG_PATH = path.join(__dirname, '..', 'data', 'images', 'rank_bg.png');
let rankBgPromise = null;
function loadRankBackground() {
  if (!rankBgPromise) {
    rankBgPromise = loadImage(RANK_BG_PATH).catch((error) => {
      console.error(`Rank background not loaded: ${error.message}`);
      rankBgPromise = null;
      return null;
    });
  }
  return rankBgPromise;
}

function drawImageCover(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function paintRankGradientFallback(ctx, w, h) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0a0a12');
  bg.addColorStop(1, '#073b79');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glowRed = ctx.createRadialGradient(w * 0.88, h * 0.18, 0, w * 0.88, h * 0.18, w * 0.4);
  glowRed.addColorStop(0, 'rgba(220, 80, 70, 0.16)');
  glowRed.addColorStop(1, 'rgba(220, 80, 70, 0)');
  ctx.fillStyle = glowRed;
  ctx.fillRect(0, 0, w, h);

  const glowBlue = ctx.createRadialGradient(w * 0.15, h, 0, w * 0.15, h, w * 0.6);
  glowBlue.addColorStop(0, 'rgba(20, 90, 170, 0.35)');
  glowBlue.addColorStop(1, 'rgba(20, 90, 170, 0)');
  ctx.fillStyle = glowBlue;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 2;
  for (let i = -h; i < w; i += 46) {
    ctx.beginPath();
    ctx.moveTo(i, h);
    ctx.lineTo(i + h, 0);
    ctx.stroke();
  }
  ctx.restore();
}

async function paintRankBackground(ctx, w, h) {
  const bg = await loadRankBackground();
  if (bg) return drawImageCover(ctx, bg, w, h);
  paintRankGradientFallback(ctx, w, h);
}

async function drawRankAvatar(ctx, { avatarURL, decorationURL, cx, cy, r }) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  try {
    const img = await loadImage(avatarURL);
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } catch {
    ctx.fillStyle = '#242a3d';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();

  if (decorationURL) {
    try {
      const deco = await loadImage(decorationURL);
      const decoSize = r * 2 * 1.34;
      ctx.drawImage(deco, cx - decoSize / 2, cy - decoSize / 2, decoSize, decoSize);
      return;
    } catch {
    }
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.stroke();
}

async function drawGuildIcon(ctx, url, cx, cy, r, shape = 'circle') {
  if (!url) return;
  ctx.save();
  if (shape === 'roundedSquare') {
    roundedRectPath(ctx, cx - r, cy - r, r * 2, r * 2, r * 0.35);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
  }
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } catch {
  }
  ctx.restore();
}

function shadowedText(ctx, text, x, y) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function cardsStatBlock(ctx, x, y, value) {
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'right';
  ctx.fillStyle = MUTED;
  ctx.font = `600 20px ${FONT}`;
  shadowedText(ctx, 'CARDS', x, y);

  ctx.font = `700 30px ${FONT}`;

  ctx.save();
  ctx.shadowColor = '#ff9d00';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffb020';
  ctx.fillText(value, x, y + 34);
  ctx.fillText(value, x, y + 34);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe08a';
  ctx.fillText(value, x, y + 34);
  ctx.restore();

  ctx.textAlign = prevAlign;
}

function statBlock(ctx, x, y, label, value, sub, align = 'left', valueColor = '#ffffff') {
  const prevAlign = ctx.textAlign;
  ctx.textAlign = align;
  ctx.fillStyle = MUTED;
  ctx.font = `600 20px ${FONT}`;
  shadowedText(ctx, label.toUpperCase(), x, y);
  ctx.fillStyle = valueColor;
  ctx.font = `700 42px ${FONT}`;
  shadowedText(ctx, value, x, y + 44);
  if (sub) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 18px ${FONT}`;
    shadowedText(ctx, sub, x, y + 68);
  }
  ctx.textAlign = prevAlign;
}

async function drawServerTag(ctx, { tag, badgeURL }, nameEndX, nameBaselineY) {
  if (!tag) return;
  const gap = 14;
  const height = 26;
  const iconSize = 16;
  const paddingX = 8;
  const centerY = nameBaselineY - 13;

  ctx.font = `700 14px ${FONT}`;
  const textWidth = ctx.measureText(tag).width;
  const contentWidth = iconSize + 6 + textWidth;
  const pillWidth = contentWidth + paddingX * 2;
  const pillX = nameEndX + gap;
  const pillY = centerY - height / 2;

  roundedRectPath(ctx, pillX, pillY, pillWidth, height, 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();

  let cursorX = pillX + paddingX;
  if (badgeURL) {
    try {
      const badge = await loadImage(badgeURL);
      ctx.drawImage(badge, cursorX, centerY - iconSize / 2, iconSize, iconSize);
    } catch {
    }
  }
  cursorX += iconSize + 6;

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 14px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, cursorX, centerY);
  ctx.textBaseline = 'alphabetic';
}

async function renderProfileCard({
  avatarURL,
  avatarDecorationURL,
  guildIconURL,
  serverTag,
  displayName,
  username,
  level,
  levelXp,
  xpNeeded,
  rank,
  totalXp,
  commandCount,
  voiceMs,
  balance,
  avatarShape,
  backgroundURL,
  cardBoostMultiplier,
}) {
  const W = 800, H = 800;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  await paintBackground(ctx, W, H, backgroundURL);

  if (avatarShape === 'circle') {
    await drawRankAvatar(ctx, { avatarURL, decorationURL: avatarDecorationURL, cx: 132, cy: 132, r: 82 });
  } else {
    await drawAvatar(ctx, avatarURL, 48, 48, 160, 28, avatarShape);
  }
  await drawGuildIcon(ctx, guildIconURL, 752, 56, 32, 'roundedSquare');

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 38px ${FONT}`;
  shadowedText(ctx, displayName, 254, 100);
  if (serverTag) await drawServerTag(ctx, serverTag, 254 + ctx.measureText(displayName).width, 100);
  ctx.fillStyle = MUTED;
  ctx.font = `400 24px ${FONT}`;
  shadowedText(ctx, `@${username}`, 254, 134);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 246);
  ctx.lineTo(W - 48, 246);
  ctx.stroke();

  statBlock(ctx, 48, 320, 'Level', String(level), `${comma(levelXp)}/${comma(xpNeeded)}`);
  const tier = tierOf(level);
  const badge = tier && await badgeImage(tier);
  if (badge) {
    ctx.font = `700 42px ${FONT}`;
    ctx.drawImage(badge, 48 + ctx.measureText(String(level)).width + 6, 314, 64, 64);
  }
  statBlock(ctx, 48, 450, 'Rank', `#${comma(rank)}`);
  statBlock(ctx, 48, 580, 'XP', compact(totalXp));
  statBlock(ctx, 48, 690, 'RVP', compact(balance));

  statBlock(ctx, W - 48, 320, 'Cmds', compact(commandCount), null, 'right');
  statBlock(ctx, W - 48, 450, 'Voice', duration(voiceMs), null, 'right');
  if (cardBoostMultiplier) {
    cardsStatBlock(ctx, W - 48, 580, `+${Math.round((cardBoostMultiplier - 1) * 100)}% XP`);
  }

  return canvas.encode('webp', CARD_QUALITY);
}

async function renderRankCard({
  avatarURL,
  avatarDecorationURL,
  guildIconURL,
  displayName,
  level,
  rank,
  levelXp,
  xpNeeded,
  voiceMs,
  messageCount,
  totalXp,
}) {
  const W = 1000, H = 380;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  await paintRankBackground(ctx, W, H);
  await drawRankAvatar(ctx, { avatarURL, decorationURL: avatarDecorationURL, cx: 135, cy: 180, r: 95 });
  await drawGuildIcon(ctx, guildIconURL, 940, 45, 28);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 36px ${FONT}`;
  ctx.fillText(displayName, 255, 72);
  ctx.fillStyle = MUTED;
  ctx.font = `400 24px ${FONT}`;
  ctx.fillText(`Level ${level} • Rank #${comma(rank)}`, 255, 112);

  const barX = 255, barY = 155, barW = 705, barH = 34;
  roundedRectPath(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();

  const progress = xpNeeded > 0 ? Math.min(1, Math.max(0, levelXp / xpNeeded)) : 0;
  const fillW = progress > 0 ? Math.max(barH, barW * progress) : 0;
  const barLabel = `${comma(levelXp)} / ${comma(xpNeeded)} XP`;
  ctx.font = `700 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(barLabel, barX + barW / 2, barY + 23);
  if (fillW) {
    ctx.save();
    roundedRectPath(ctx, barX, barY, fillW, barH, barH / 2);
    ctx.clip();
    ctx.fillStyle = BAR_FILL;
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.fillStyle = '#1b1b1f';
    ctx.fillText(barLabel, barX + barW / 2, barY + 23);
    ctx.restore();
  }
  ctx.textAlign = 'left';

  const labelY = 232, valueY = 272;
  const cols = [
    ['Voice', duration(voiceMs)],
    ['Chat', compact(messageCount)],
    ['Total XP', compact(totalXp)],
  ];
  cols.forEach(([label, value], i) => {
    const x = 255 + i * 250;
    ctx.fillStyle = MUTED;
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText(label.toUpperCase(), x, labelY);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 36px ${FONT}`;
    ctx.fillText(value, x, valueY);
  });

  return canvas.encode('webp', CARD_QUALITY);
}

const X_LOGO_PATH = path.join(__dirname, '..', 'data', 'images', 'x_logo.svg');
let xLogoPromise = null;
function loadXLogo() {
  if (!xLogoPromise) {
    xLogoPromise = loadImage(X_LOGO_PATH).catch((error) => {
      console.error('Failed to load X logo:', error.message);
      xLogoPromise = null;
      return null;
    });
  }
  return xLogoPromise;
}

async function drawXLogo(ctx, x, y, size) {
  const img = await loadXLogo();
  if (img) ctx.drawImage(img, x, y, size, size);
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) { out.push(''); continue; }
    let cur = '';
    for (const word of para.split(' ')) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && cur) { out.push(cur); cur = word; }
      else cur = test;
    }
    if (cur) out.push(cur);
  }
  return out;
}

async function buildXPostCard({ avatarURL, name, handle, text, likes, replies, reposts }) {
  const W = 600;
  const PAD = 28;
  const AV = 48;
  const CONTENT_X = PAD + AV + 14;
  const CONTENT_W = W - CONTENT_X - PAD;
  const LH = 24;
  const X_FONT = '"Segoe UI", "Noto Sans", Arial, sans-serif';

  const tmp = createCanvas(W, 10);
  const tc = tmp.getContext('2d');
  tc.font = `15px ${X_FONT}`;
  const lines = wrapLines(tc, text, CONTENT_W);

  const contentStartY = PAD + 26;
  const textBlockH = Math.max(lines.length, 1) * LH;
  const H = Math.max(contentStartY + textBlockH + 20 + 1 + 20 + 20 + PAD, PAD + AV + PAD + 80);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = '#2f3336';
  ctx.lineWidth = 1;
  roundedRectPath(ctx, 1, 1, W - 2, H - 2, 16);
  ctx.stroke();

  // Avatar
  try {
    const av = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(PAD + AV / 2, PAD + AV / 2, AV / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(av, PAD, PAD, AV, AV);
    ctx.restore();
  } catch (_) {}

  // Name (bold)
  const nameY = PAD + 18;
  ctx.font = `bold 15px ${X_FONT}`;
  ctx.fillStyle = '#e7e9ea';
  ctx.fillText(name, CONTENT_X, nameY);
  const nameW = ctx.measureText(name).width;

  // Handle + time (muted)
  ctx.font = `14px ${X_FONT}`;
  ctx.fillStyle = '#71767b';
  ctx.fillText(`  @${handle} · now`, CONTENT_X + nameW, nameY);

  // X logo top-right
  await drawXLogo(ctx, W - PAD - 22, PAD, 22);

  // Post text
  ctx.font = `15px ${X_FONT}`;
  ctx.fillStyle = '#e7e9ea';
  let ty = contentStartY + LH;
  for (const line of lines) {
    if (line) ctx.fillText(line, CONTENT_X, ty);
    ty += LH;
  }

  // Divider
  const divY = ty + 8;
  ctx.strokeStyle = '#2f3336';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, divY);
  ctx.lineTo(W - PAD, divY);
  ctx.stroke();

  // Stats row
  const sY = divY + 20;
  const sIconY = sY - 12;
  ctx.font = `14px ${X_FONT}`;
  ctx.fillStyle = '#71767b';
  ctx.strokeStyle = '#71767b';
  const colW = (W - CONTENT_X - PAD) / 3;

  // Heart icon
  const hx = CONTENT_X, hy = sIconY;
  ctx.beginPath();
  ctx.moveTo(hx + 7, hy + 3);
  ctx.bezierCurveTo(hx + 7, hy + 1, hx + 5, hy, hx + 3.5, hy);
  ctx.bezierCurveTo(hx + 1, hy, hx, hy + 2, hx, hy + 4);
  ctx.bezierCurveTo(hx, hy + 7, hx + 3, hy + 10, hx + 7, hy + 13);
  ctx.bezierCurveTo(hx + 11, hy + 10, hx + 14, hy + 7, hx + 14, hy + 4);
  ctx.bezierCurveTo(hx + 14, hy + 2, hx + 13, hy, hx + 10.5, hy);
  ctx.bezierCurveTo(hx + 9, hy, hx + 7, hy + 1, hx + 7, hy + 3);
  ctx.fillStyle = '#71767b';
  ctx.fill();
  ctx.fillStyle = '#71767b';
  ctx.fillText(comma(likes), hx + 18, sY);

  // Comment bubble icon
  const cx2 = CONTENT_X + colW, cy2 = sIconY;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#71767b';
  ctx.beginPath();
  ctx.roundRect(cx2, cy2, 13, 11, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx2 + 3, cy2 + 11);
  ctx.lineTo(cx2 + 1, cy2 + 14);
  ctx.lineTo(cx2 + 6, cy2 + 11);
  ctx.stroke();
  ctx.fillStyle = '#71767b';
  ctx.fillText(comma(replies), cx2 + 18, sY);

  // Repost arrows icon
  const rx = CONTENT_X + colW * 2, ry = sIconY;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#71767b';
  ctx.beginPath();
  ctx.moveTo(rx + 2, ry + 8);
  ctx.lineTo(rx + 2, ry + 4);
  ctx.arcTo(rx + 2, ry + 1, rx + 5, ry + 1, 3);
  ctx.lineTo(rx + 10, ry + 1);
  ctx.moveTo(rx + 8, ry - 1);
  ctx.lineTo(rx + 12, ry + 1);
  ctx.lineTo(rx + 8, ry + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx + 12, ry + 6);
  ctx.lineTo(rx + 12, ry + 10);
  ctx.arcTo(rx + 12, ry + 13, rx + 9, ry + 13, 3);
  ctx.lineTo(rx + 4, ry + 13);
  ctx.moveTo(rx + 6, ry + 11);
  ctx.lineTo(rx + 2, ry + 13);
  ctx.lineTo(rx + 6, ry + 15);
  ctx.stroke();
  ctx.fillStyle = '#71767b';
  ctx.fillText(comma(reposts), rx + 18, sY);

  return canvas.toBuffer('image/png');
}

module.exports = { renderProfileCard, renderRankCard, buildXPostCard, ACCENT };
