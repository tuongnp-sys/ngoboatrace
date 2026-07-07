import Phaser from 'phaser';
import { getTeamAccentPhaser, getTeamBrand } from '@/config/team.brands';
import { getTeamColor } from '@/config/team.colors';
import { TEAMS } from '@/config/teams.config';
import { drawBoatHull, drawCoxswain, drawOar } from '@/game/utils/drawBoatCrew';
import { drawTeamFlag } from '@/game/utils/drawTeamFlag';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    this.generateTextures();
    this.registry.set('texturesReady', true);
    this.cameras.main.setBackgroundColor('#0d4f6b');
  }

  private generateTextures(): void {
    this.createWaterTexture();
    this.createShoreTexture();

    for (const team of TEAMS) {
      this.createBoatTexture(`boat-${team.id}`, getTeamColor(team.id));
      this.createFlagTexture(`flag-${team.id}`, team.id);
      this.createCoxswainTexture(`coxswain-${team.id}`, getTeamAccentPhaser(team.id));
    }
    this.createOarTexture();
  }

  private createWaterTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a6b8a, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x2088a8, 0.35);
    g.fillRect(0, 20, 64, 8);
    g.fillRect(0, 45, 64, 6);
    g.generateTexture('water-tile', 64, 64);
    g.destroy();
  }

  private createShoreTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2d5016, 1);
    g.fillRect(0, 0, 128, 48);
    g.fillStyle(0x3d6b1e, 1);
    g.fillRect(0, 0, 128, 12);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x4a7c23, 1);
      g.fillCircle(8 + i * 16, 8, 6);
    }
    g.generateTexture('shore', 128, 48);
    g.destroy();
  }

  private createBoatTexture(key: string, color: number): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    drawBoatHull(g, color);
    g.generateTexture(key, 96, 36);
    g.destroy();
  }

  private createOarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    drawOar(g);
    g.generateTexture('crew-oar', 24, 4);
    g.destroy();
  }

  private createCoxswainTexture(key: string, shirtColor: number): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    drawCoxswain(g, shirtColor);
    g.generateTexture(key, 36, 22);
    g.destroy();
  }

  private createFlagTexture(key: string, teamId: string): void {
    const brand = getTeamBrand(teamId);
    const g = this.make.graphics({ x: 0, y: 0 });
    drawTeamFlag(
      g,
      brand.symbol,
      getTeamColor(teamId),
      getTeamAccentPhaser(teamId),
      brand.bannerText,
      2,
      2,
    );
    g.generateTexture(key, 26, 34);
    g.destroy();
  }
}
