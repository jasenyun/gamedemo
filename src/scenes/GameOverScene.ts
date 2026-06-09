import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; level: number }) {
    this.registry.set('finalScore', data.score ?? 0);
    this.registry.set('finalLevel', data.level ?? 1);
  }

  create() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const score = this.registry.get('finalScore');
    const level = this.registry.get('finalLevel');

    // 背景
    this.add.image(W / 2, H / 2, 'bg')
      .setDisplaySize(W, H).setAlpha(0.4);

    // 半透明遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);

    // 标题
    this.add.text(W / 2, H / 2 - 120, 'GAME OVER', {
      fontSize: '40px', color: '#ff4081',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 分数
    this.add.text(W / 2, H / 2 - 40, `得分：${score}`, {
      fontSize: '24px', color: '#ffd740', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 关卡
    this.add.text(W / 2, H / 2, `通关：第 ${level} 关`, {
      fontSize: '18px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 再来一次按钮
    const btn = this.add.text(W / 2, H / 2 + 80, '再来一次', {
      fontSize: '22px', color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#7c4dff',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#ffd740' }));
    btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
    btn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameScene');
    });

    // 入场动画
    this.cameras.main.fadeIn(400);
  }
}
