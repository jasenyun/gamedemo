import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export class StartScene extends Phaser.Scene {
  private startBtn!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
    // 黑色背景
       // 背景图（使用加载好的图片）
    this.add.image(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      'bg'
    ).setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT).setDepth(0);

    // 游戏名
    this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 - 60,
      '打 砖 块',
      {
        fontSize: '48px',
        color: '#ffd740',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);

    // 点击开始按钮
    this.startBtn = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 + 40,
      '点击开始',
      {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }
    ).setOrigin(0.5);

    // 闪烁效果
    this.tweens.add({
      targets: this.startBtn,
      alpha: 0.3,
      duration: 800,
      ease: 'Power2',
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
