import Phaser from 'phaser';
import { applyPhaserWebGLFix, getSafeParentSize } from '@/utils/phaserWebGLFix';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { RaceScene } from './scenes/RaceScene';

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  applyPhaserWebGLFix();

  const { width, height } = getSafeParentSize(parent);

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#0d4f6b',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, RaceScene],
    audio: {
      disableWebAudio: false,
    },
    render: {
      antialias: true,
      pixelArt: false,
      powerPreference: 'default',
    },
  });
}

export function destroyPhaserGame(game: Phaser.Game | null): void {
  if (game) {
    game.destroy(true);
  }
}
