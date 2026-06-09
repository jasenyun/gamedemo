import * as Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.scoreText = this.add.text(12, 12, 'SCORE: 0', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });

    this.livesText = this.add.text(12, 30, 'LIVES: ♥♥♥', {
      fontSize: '14px',
      color: '#ff4081',
      fontFamily: 'monospace',
    });

    this.levelText = this.add.text(360, 12, 'LV.1', {
      fontSize: '14px',
      color: '#ffd740',
      fontFamily: 'monospace',
    });

    // 监听来自 GameScene 的数据更新
    this.scene.get('GameScene').events.on('update-ui', (data: {
      score: number;
      lives: number;
      level: number;
    }) => {
      this.scoreText.setText(`SCORE: ${data.score}`);
      this.livesText.setText(`LIVES: ${'♥'.repeat(Math.max(0, data.lives))}`);
      this.levelText.setText(`LV.${data.level}`);
    });
  }
}
