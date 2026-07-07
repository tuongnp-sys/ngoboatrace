import type Phaser from 'phaser';
import type { FlagSymbol } from '@/config/team.brands';

/** Vẽ cây cờ cắm ở mũi ghe — cột bên phải, lá cờ bay về phía sau (trái) */
export function drawTeamFlag(
  g: Phaser.GameObjects.Graphics,
  symbol: FlagSymbol,
  primaryColor: number,
  accentColor: number,
  bannerText: string,
  originX: number,
  originY: number,
): void {
  const poleX = originX + 20;
  const poleY = originY;

  g.fillStyle(0x5c3d1e, 1);
  g.fillRect(poleX, poleY, 2, 30);

  g.fillStyle(primaryColor, 1);
  g.fillTriangle(poleX, poleY, poleX, poleY + 16, poleX - 20, poleY + 8);

  g.fillStyle(accentColor, 0.85);
  g.fillTriangle(poleX, poleY + 16, poleX - 20, poleY + 8, poleX - 16, poleY + 14);

  drawSymbol(g, symbol, poleX - 11, poleY + 7, accentColor);

  if (bannerText.length <= 3) {
    g.fillStyle(accentColor, 1);
    const textX = poleX - 16;
    const textY = poleY + 12;
    for (let i = 0; i < bannerText.length; i++) {
      g.fillRect(textX + i * 4, textY, 3, 1);
    }
  }
}

function drawSymbol(
  g: Phaser.GameObjects.Graphics,
  symbol: FlagSymbol,
  cx: number,
  cy: number,
  color: number,
): void {
  g.fillStyle(color, 1);

  switch (symbol) {
    case 'lotus':
      g.fillCircle(cx, cy, 3);
      g.fillEllipse(cx - 3, cy + 1, 2, 3);
      g.fillEllipse(cx + 3, cy + 1, 2, 3);
      break;
    case 'wave':
      g.lineStyle(1.5, color, 1);
      g.beginPath();
      g.moveTo(cx - 5, cy);
      g.lineTo(cx - 2, cy - 2);
      g.lineTo(cx + 1, cy);
      g.lineTo(cx + 4, cy + 2);
      g.lineTo(cx + 7, cy);
      g.strokePath();
      break;
    case 'rice':
      g.fillRect(cx - 0.5, cy - 4, 1, 8);
      g.fillRect(cx - 3.5, cy - 2, 1, 6);
      g.fillRect(cx + 2.5, cy - 2, 1, 6);
      break;
    case 'star':
      drawStar(g, cx, cy, 4, 5, color);
      break;
    case 'bird':
      g.fillTriangle(cx - 5, cy, cx, cy - 3, cx + 5, cy);
      g.fillTriangle(cx - 5, cy, cx, cy + 1, cx + 5, cy);
      break;
    case 'fish':
      g.fillEllipse(cx, cy, 4, 2.5);
      g.fillTriangle(cx + 4, cy, cx + 7, cy - 2, cx + 7, cy + 2);
      break;
  }
}

function drawStar(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  outerR: number,
  points: number,
  color: number,
): void {
  g.fillStyle(color, 1);
  const innerR = outerR * 0.45;
  const step = Math.PI / points;
  let rot = -Math.PI / 2;

  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(rot) * r;
    const y = cy + Math.sin(rot) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
    rot += step;
  }
  g.closePath();
  g.fillPath();
}
