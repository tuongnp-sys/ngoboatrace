import Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/game.config';
import { getBeatStroke } from '@/core/rhythm/BeatMap';
import { getTeamById } from '@/config/teams.config';
import { getFinishRank, getRankColor, getRankLabel } from '@/game/utils/finishRank';
import { getTeamMotto, registerLocaleRefresh, t } from '@/i18n';
import { OAR_SLOTS } from '@/game/utils/drawBoatCrew';
import type { RaceController } from '@/game/RaceController';
import type { BoatState } from '@/types/race.types';

interface BoatOar {
  sprite: Phaser.GameObjects.Sprite;
  side: 'top' | 'bottom';
}

interface BoatSprite {
  container: Phaser.GameObjects.Container;
  flag: Phaser.GameObjects.Sprite;
  oars: BoatOar[];
  coxswain: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  mottoLabel?: Phaser.GameObjects.Text;
  rankBadge?: Phaser.GameObjects.Text;
  lane: number;
  boatId: string;
  isPlayer: boolean;
}

export class RaceScene extends Phaser.Scene {
  private controller!: RaceController;
  private playerTeamId = 'soc-trang';
  private boatSprites: BoatSprite[] = [];
  private waterTiles: Phaser.GameObjects.TileSprite[] = [];
  private finishLineX = 0;
  private trackStartX = 80;
  private finishLabel?: Phaser.GameObjects.Text;
  private crowdBanner?: Phaser.GameObjects.Text;
  private localeUnsub: (() => void) | null = null;
  private onStateUpdate?: (boats: BoatState[]) => void;

  constructor() {
    super({ key: 'RaceScene' });
  }

  init(data: {
    controller: RaceController;
    playerTeamId?: string;
    onStateUpdate?: (boats: BoatState[]) => void;
  }): void {
    this.controller = data.controller;
    this.playerTeamId = data.playerTeamId ?? 'soc-trang';
    this.onStateUpdate = data.onStateUpdate;
  }

  create(): void {
    const width = Math.max(this.scale.width, 1);
    const height = Math.max(this.scale.height, 1);

    this.finishLineX = width - 60;
    this.createBackground(width, height);
    this.createShore(width, height);
    this.createFinishLine(height);
    this.createBoats();
    this.createCrowdLabels(width);

    this.localeUnsub = registerLocaleRefresh(() => this.applyLocale());

    this.scale.on('resize', this.handleResize, this);
  }

  private applyLocale(): void {
    this.finishLabel?.setText(t('race.finishLine'));
    this.crowdBanner?.setText(t('race.banner'));

    for (const bs of this.boatSprites) {
      if (bs.isPlayer) {
        bs.label.setText(t('race.player'));
        bs.mottoLabel?.setText(getTeamMotto(this.playerTeamId));
      }
    }
  }

  update(): void {
    if (!this.controller.isStarted()) return;

    const frozen = this.registry.get('raceFrozen') === true;

    if (!frozen) {
      const output = this.controller.tick();
      this.updateBoatPositions(output.state.boats);
      this.onStateUpdate?.(output.state.boats);

      this.waterTiles.forEach((tile) => {
        const playerSpeed = output.state.boats.find((b) => b.isPlayer)!.speed;
        tile.tilePositionX +=
          GAME_CONFIG.VISUAL_WATER_SCROLL_BASE +
          playerSpeed * GAME_CONFIG.VISUAL_WATER_PARALLAX_MULT;
      });
    } else {
      this.updateBoatPositions(this.controller.getState().boats);
    }
  }

  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.localeUnsub?.();
    this.localeUnsub = null;
    this.boatSprites = [];
    this.waterTiles = [];
  }

  private createBackground(width: number, height: number): void {
    const tile = this.add.tileSprite(0, 0, width, height, 'water-tile');
    tile.setOrigin(0, 0);
    tile.setDepth(0);
    this.waterTiles.push(tile);
  }

  private createShore(width: number, height: number): void {
    const shore = this.add.tileSprite(0, height - 48, width, 48, 'shore');
    shore.setOrigin(0, 1);
    shore.setDepth(2);
  }

  private createFinishLine(height: number): void {
    const g = this.add.graphics();
    g.setDepth(3);
    g.fillStyle(0xffd700, 0.8);
    for (let y = 0; y < height - 48; y += 16) {
      g.fillRect(this.finishLineX, y, 6, 8);
    }

    this.finishLabel = this.add
      .text(this.finishLineX - 10, 16, t('race.finishLine'), {
        fontSize: '14px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setDepth(4);
  }

  private createCrowdLabels(width: number): void {
    this.crowdBanner = this.add
      .text(width / 2, 12, t('race.banner'), {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(4)
      .setAlpha(0.85);
  }

  private createBoats(): void {
    const state = this.controller.getState();
    const laneHeight = (this.scale.height - 80) / state.boats.length;

    state.boats.forEach((boat, i) => {
      const teamId = boat.isPlayer
        ? this.playerTeamId
        : (boat.personalityId ?? 'soc-trang');
      const laneY = 50 + laneHeight * i + laneHeight / 2;

      const boatSprite = this.add.sprite(0, 0, `boat-${teamId}`);

      const oars: BoatOar[] = OAR_SLOTS.map((slot) => {
        const oar = this.add.sprite(slot.x, slot.y, 'crew-oar');
        oar.setOrigin(0, 0.5);
        const baseAngle = slot.side === 'top' ? -Math.PI / 2 : Math.PI / 2;
        oar.setRotation(baseAngle);
        oar.setDepth(slot.side === 'top' ? 0.5 : -0.5);
        return { sprite: oar, side: slot.side };
      });

      const coxswain = this.add.sprite(0, 1, `coxswain-${teamId}`);
      coxswain.setOrigin(0.5, 1);
      coxswain.setDepth(0.85);

      const flag = this.add.sprite(46, -14, `flag-${teamId}`);
      flag.setOrigin(0.88, 0.9);
      flag.setDepth(1);

      const container = this.add.container(this.trackStartX, laneY, [
        ...oars.map((o) => o.sprite),
        boatSprite,
        coxswain,
        flag,
      ]);
      container.setDepth(5);
      container.setScale(boat.isPlayer ? 1.15 : 1);

      const teamName = boat.isPlayer
        ? t('race.player')
        : (getTeamById(teamId)?.name ?? teamId.replace(/-/g, ' '));
      const label = this.add
        .text(this.trackStartX - 10, laneY - 24, teamName, {
          fontSize: '11px',
          color: boat.isPlayer ? '#ffd700' : '#cce7ff',
        })
        .setDepth(6);

      let mottoLabel: Phaser.GameObjects.Text | undefined;
      if (boat.isPlayer) {
        mottoLabel = this.add
          .text(this.trackStartX - 10, laneY - 12, getTeamMotto(teamId), {
            fontSize: '8px',
            color: '#a8d4f0',
            fontStyle: 'italic',
          })
          .setDepth(6);
      }

      this.boatSprites.push({
        container,
        flag,
        oars,
        coxswain,
        label,
        mottoLabel,
        lane: laneY,
        boatId: boat.id,
        isPlayer: boat.isPlayer,
      });
    });
  }

  private updateBoatPositions(boats: BoatState[]): void {
    const trackWidth = this.finishLineX - this.trackStartX - 40;
    const bpm = this.controller.getConfig().bpm;
    const elapsedMs = this.controller.getState().elapsedMs;

    for (const bs of this.boatSprites) {
      const boat = boats.find((b) => b.id === bs.boatId);
      if (!boat) continue;

      const x = this.trackStartX + boat.progress * trackWidth;
      bs.container.setX(x);

      if (boat.finished) {
        bs.container.setAlpha(0.85);
      }

      const bounce =
        boat.finished || boat.speed <= 0
          ? 0
          : Math.sin(this.time.now / 120 + bs.lane) * 2;
      bs.container.setY(bs.lane + bounce);
      bs.label.setPosition(x - 10, bs.lane + bounce - 24);
      bs.mottoLabel?.setPosition(x - 10, bs.lane + bounce - 12);

      if (boat.finished) {
        this.setBoatAtRest(bs);
        this.showRankBadge(bs, boat, boats, x, bounce);
        bs.rankBadge?.setPosition(x + 24, bs.lane + bounce - 38);
        continue;
      }

      const rowing = boat.speed > 0;
      const strokeMs = bs.isPlayer
        ? elapsedMs
        : elapsedMs + bs.lane * 40;
      const stroke = rowing ? getBeatStroke(strokeMs, bpm, 0.45) : 0;

      const wobble = rowing
        ? Math.sin(this.time.now / 160 + bs.lane * 0.5) * 0.1
        : 0;
      bs.flag.setRotation(wobble);

      for (const oar of bs.oars) {
        const base = oar.side === 'top' ? -Math.PI / 2 : Math.PI / 2;
        const sign = oar.side === 'top' ? 1 : -1;
        oar.sprite.setRotation(base + stroke * sign);
      }

      const armWave = rowing ? getBeatStroke(strokeMs, bpm, 0.08) : 0;
      bs.coxswain.setRotation(armWave);
    }
  }

  private showRankBadge(
    bs: BoatSprite,
    boat: BoatState,
    boats: BoatState[],
    x: number,
    bounce: number,
  ): void {
    if (bs.rankBadge) return;

    const rank = getFinishRank(boat.id, boats);
    if (!rank) return;

    const fontSize = rank <= 3 ? '22px' : rank === 4 ? '18px' : '14px';
    const badge = this.add
      .text(x + 24, bs.lane + bounce - 38, getRankLabel(rank), {
        fontSize,
        fontStyle: 'bold',
        color: getRankColor(rank),
        stroke: '#1a1a2e',
        strokeThickness: rank <= 3 ? 5 : 4,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(8)
      .setScale(0);

    bs.rankBadge = badge;
    this.tweens.add({
      targets: badge,
      scale: 1,
      duration: 280,
      ease: 'Back.easeOut',
    });
  }

  private setBoatAtRest(bs: BoatSprite): void {
    for (const oar of bs.oars) {
      const base = oar.side === 'top' ? -Math.PI / 2 : Math.PI / 2;
      oar.sprite.setRotation(base);
    }
    bs.coxswain.setRotation(0);
    bs.flag.setRotation(0);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = Math.max(gameSize.width, 1);
    const height = Math.max(gameSize.height, 1);

    this.finishLineX = width - 60;
    if (this.waterTiles[0]) {
      this.waterTiles[0].setSize(width, height);
    }
  }
}
