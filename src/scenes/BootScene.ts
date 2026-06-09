import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // ── 进度条 UI ──
    const barBg = this.add.rectangle(W / 2, H / 2, 300, 20, 0x333355)
      .setOrigin(0.5);
    const bar = this.add.rectangle(W / 2 - 150, H / 2, 0, 16, 0x7c4dff)
      .setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 30, '加载资源中...', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = 296 * v;
    });

    // ── 加载图片 ──
    ['paddle', 'ball', 'brick_normal', 'brick_steel', 'brick_explosive', 'bg']
      .forEach(key => this.load.image(key, `assets/${key}.png`));
  }

  create() {
    this.scene.start('StartScene');
  }
}
