import type Phaser from 'phaser';

/** Vị trí dầm trên container ghe (gốc tại tâm sprite thân) */
export const OAR_SLOTS = [
  { x: -30, y: -8, side: 'top' as const },
  { x: -20, y: 9, side: 'bottom' as const },
  { x: -10, y: -8, side: 'top' as const },
  { x: 0, y: 9, side: 'bottom' as const },
  { x: 10, y: -8, side: 'top' as const },
  { x: 20, y: 9, side: 'bottom' as const },
];

const CREW_HEAD_X = [16, 26, 36, 46, 56, 66];
const CREW_HEAD_Y_TOP = { skin: 7, hair: 6 };
const CREW_HEAD_Y_BOTTOM = { skin: 29, hair: 30 };

function drawCrewHead(
  g: Phaser.GameObjects.Graphics,
  hx: number,
  skinY: number,
  hairY: number,
): void {
  g.fillStyle(0xffd4a8, 1);
  g.fillCircle(hx, skinY, 2.5);
  g.fillStyle(0x2a1810, 1);
  g.fillCircle(hx, hairY, 2);
}

/** Thân ghe + đầu người chèo ló hai mép (cân xứng trên/dưới) */
export function drawBoatHull(g: Phaser.GameObjects.Graphics, color: number): void {
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 8, 80, 20, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillTriangle(80, 8, 96, 18, 80, 28);

  for (const hx of CREW_HEAD_X) {
    drawCrewHead(g, hx, CREW_HEAD_Y_TOP.skin, CREW_HEAD_Y_TOP.hair);
    drawCrewHead(g, hx, CREW_HEAD_Y_BOTTOM.skin, CREW_HEAD_Y_BOTTOM.hair);
  }
}

/** Một cây dầm (gốc bên trái = chỗ cầm trên thành ghe) */
export function drawOar(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x8b6914, 1);
  g.fillRect(0, 1, 18, 2);
  g.fillStyle(0x5c7a2e, 1);
  g.fillRect(16, 0, 7, 4);
}

/** Người hái / chỉ huy — áo màu accent đội (tương phản thân ghe) */
export function drawCoxswain(g: Phaser.GameObjects.Graphics, shirtColor: number): void {
  const cx = 14;

  g.fillStyle(0x2a1810, 1);
  g.fillRect(cx - 1, 14, 3, 8);

  g.fillStyle(shirtColor, 1);
  g.fillRect(cx - 4, 8, 8, 8);
  g.lineStyle(1, 0x1a1a2e, 1);
  g.strokeRect(cx - 4, 8, 8, 8);

  g.fillStyle(0xffd4a8, 1);
  g.fillCircle(cx, 5, 4);

  g.fillStyle(0xffd4a8, 1);
  g.fillRect(cx + 3, 7, 10, 2);
  g.fillTriangle(cx + 13, 6, cx + 18, 8, cx + 13, 10);

  g.fillStyle(0x3d2817, 1);
  g.fillRect(cx - 3, 16, 3, 5);
  g.fillRect(cx + 1, 16, 3, 5);
}
