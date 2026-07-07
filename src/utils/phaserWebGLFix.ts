import Phaser from 'phaser';

let applied = false;

/**
 * Phaser 3 WebGL can crash with "Framebuffer status: Incomplete Attachment"
 * when resize targets 0×0. Patch enforces minimum 1×1 framebuffer size.
 * @see https://github.com/phaserjs/phaser/issues/7221
 */
export function applyPhaserWebGLFix(): void {
  if (applied) return;
  applied = true;

  const RT = Phaser.Renderer.WebGL?.RenderTarget?.prototype;
  if (!RT?.resize) return;

  const originalResize = RT.resize;
  RT.resize = function (width: number, height: number) {
    return originalResize.call(this, Math.max(width, 1), Math.max(height, 1));
  };
}

export function getSafeParentSize(parent: HTMLElement): { width: number; height: number } {
  const width = Math.max(parent.clientWidth, window.innerWidth, 1);
  const height = Math.max(parent.clientHeight, window.innerHeight, 1);
  return { width, height };
}

/** Wait for DOM layout so clientWidth/Height are non-zero. */
export function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
