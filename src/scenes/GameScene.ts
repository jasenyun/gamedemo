import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

type BrickData = {
  row: number;
  col: number;
  hp: number;
  type: 'normal' | 'steel' | 'explosive';
};

export class GameScene extends Phaser.Scene {
  // 游戏对象
  private paddle!: Phaser.Physics.Arcade.Image;
  private ball!: Phaser.Physics.Arcade.Image;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private brickCollider!: Phaser.Physics.Arcade.Collider;

  // 状态
  private score = 0;
  private lives = 3;
  private level = 1;
  private ballLaunched = false;
  private brickDataMap = new Map<
    Phaser.Physics.Arcade.Image,
    BrickData
  >();

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.score = 0;
    this.lives = 3;
    this.ballLaunched = false;
    this.brickDataMap.clear();

    // 背景图（使用加载好的图片）
    this.add.image(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      'bg'
    ).setDisplaySize(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT).setDepth(0);

    this.createPaddle();
    this.createBall();
    this.createBricks(this.getDefaultLevel());
    this.setupCollisions();
    this.setupInput();

    // 启动 UI
    this.scene.launch('UIScene');
    this.emitUI();

    // 提示文字
    const hint = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 + 60,
      '点击 / 按空格 发射',
      {
        fontSize: '16px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      }
    ).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      hint.destroy();
      this.launchBall();
    });
    this.input.keyboard!.once('keydown-SPACE', () => {
      hint.destroy();
      this.launchBall();
    });
  }

  // ── 创建挡板 ──────────────────────────────
  private createPaddle() {
    // 图片原始 180×37，目标 90×14
    // 用 setScale 缩放，body 自动跟着缩放，不需要手动 setOffset
    const scaleX = GAME_CONFIG.PADDLE_WIDTH / 180;
    const scaleY = GAME_CONFIG.PADDLE_HEIGHT / 37;

    this.paddle = this.physics.add
      .image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 40, 'paddle')
      .setScale(scaleX, scaleY)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    const body = this.paddle.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  // ── 创建小球 ──────────────────────────────
  private createBall() {
    // 图片原始 40×40，目标 16×16
    const scale = GAME_CONFIG.BALL_SIZE / 40;

    this.ball = this.physics.add
      .image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 65, 'ball')
      .setScale(scale)
      .setCollideWorldBounds(true)
      .setBounce(1);

    const body = this.ball.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    body.onWorldBounds = true;
    this.physics.world.on(
      'worldbounds',
      (b: Phaser.Physics.Arcade.Body, _u: boolean, down: boolean) => {
        if (b === body && down) this.loseLife();
      }
    );
  }

  // ── 发射小球 ──────────────────────────────
  private launchBall() {
    if (this.ballLaunched) return;
    this.ballLaunched = true;
    const angle = Phaser.Math.Between(-60, 60) - 90; // 向上
    const rad = Phaser.Math.DegToRad(angle);
    this.ball.setVelocity(
      Math.cos(rad) * GAME_CONFIG.BALL_SPEED,
      Math.sin(rad) * GAME_CONFIG.BALL_SPEED
    );
  }

  // ── 砖块布局（默认关卡）──────────────────
  private getDefaultLevel(): BrickData[] {
    const bricks: BrickData[] = [];
    const types: BrickData['type'][] = [
      'normal', 'normal', 'normal',
      'steel', 'explosive',
    ];
    for (let r = 0; r < GAME_CONFIG.BRICK_ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.BRICK_COLS; c++) {
        const type = types[
          Math.floor(Math.random() * types.length)
        ];
        bricks.push({
          row: r,
          col: c,
          hp: type === 'steel' ? 2 : 1,
          type,
        });
      }
    }
    return bricks;
  }

  // ── 根据数据创建砖块 ─────────────────────
  private createBricks(data: BrickData[]) {
    this.bricks = this.physics.add.staticGroup();
    const textureMap = {
      normal: 'brick_normal',
      steel: 'brick_steel',
      explosive: 'brick_explosive',
    };

    data.forEach((b) => {
      const x =
        GAME_CONFIG.BRICK_OFFSET_X +
        b.col * (GAME_CONFIG.BRICK_WIDTH + GAME_CONFIG.BRICK_PADDING) +
        GAME_CONFIG.BRICK_WIDTH / 2;
      const y =
        GAME_CONFIG.BRICK_OFFSET_Y +
        b.row * (GAME_CONFIG.BRICK_HEIGHT + GAME_CONFIG.BRICK_PADDING) +
        GAME_CONFIG.BRICK_HEIGHT / 2;

      const brick = this.bricks.create(
        x, y, textureMap[b.type]
      ) as Phaser.Physics.Arcade.Image;

      // 原始约 100×39，用 setScale 缩放后 refreshBody 同步 staticBody
      const bScaleX = GAME_CONFIG.BRICK_WIDTH / 100;
      const bScaleY = GAME_CONFIG.BRICK_HEIGHT / 39;
      brick.setScale(bScaleX, bScaleY);
      brick.refreshBody();

      this.brickDataMap.set(brick, { ...b });
    });
  }

  // ── 碰撞设置 ─────────────────────────────
  private setupCollisions() {
    // 小球 vs 挡板（只注册一次，挡板不重建）
    this.physics.add.collider(
      this.ball,
      this.paddle,
      this.handleBallPaddleCollision,
      undefined,
      this
    );
    // 小球 vs 砖块（保存引用，换关时可销毁重建）
    this.brickCollider = this.physics.add.collider(
      this.ball,
      this.bricks,
      this.handleBallBrickCollision,
      undefined,
      this
    );
  }

  // ── 重新注册砖块碰撞器（换关时调用）────────
  private resetBrickCollider() {
    if (this.brickCollider) {
      this.physics.world.removeCollider(this.brickCollider);
    }
    this.brickCollider = this.physics.add.collider(
      this.ball,
      this.bricks,
      this.handleBallBrickCollision,
      undefined,
      this
    );
  }

  // ── 小球撞挡板：根据位置改变反弹角度 ─────────
  private handleBallPaddleCollision() {
    const diff = this.ball.x - this.paddle.x;
    const angle = (diff / (GAME_CONFIG.PADDLE_WIDTH / 2)) * 60;
    const rad = Phaser.Math.DegToRad(angle - 90);
    const speed = GAME_CONFIG.BALL_SPEED;
    this.ball.setVelocity(
      Math.cos(rad) * speed,
      Math.sin(rad) * speed
    );
  }

  // ── 小球撞砖块 ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleBallBrickCollision(
    _ball: any,
    brickObj: any
  ) {
    const brick = brickObj as Phaser.Physics.Arcade.Image;
    const data = this.brickDataMap.get(brick);
    if (!data) return;

    data.hp -= 1;

    if (data.hp <= 0) {
      if (data.type === 'explosive') {
        this.explodeAround(data.row, data.col);
      }
      brick.destroy();
      this.brickDataMap.delete(brick);
      this.addScore(data.type === 'steel' ? 20 : 10);

      // 全部消除 → 下一关
      if (this.brickDataMap.size === 0) this.nextLevel();
    } else {
      brick.setAlpha(0.5);
    }
  }

  // ── 爆炸砖块：消灭周围 ───────────────────
  private explodeAround(row: number, col: number) {
    this.brickDataMap.forEach((data, brick) => {
      if (
        Math.abs(data.row - row) <= 1 &&
        Math.abs(data.col - col) <= 1
      ) {
        brick.destroy();
        this.brickDataMap.delete(brick);
        this.addScore(5);
      }
    });
  }

  // ── 键盘 + 鼠标控制挡板 ──────────────────
  private setupInput() {
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,A,S,D') as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    this.events.on('update', () => {
      const body = this.paddle
        .body as Phaser.Physics.Arcade.Body;
      if (cursors.left.isDown || wasd.A.isDown) {
        body.setVelocityX(-GAME_CONFIG.PADDLE_SPEED);
      } else if (cursors.right.isDown || wasd.D.isDown) {
        body.setVelocityX(GAME_CONFIG.PADDLE_SPEED);
      } else {
        body.setVelocityX(0);
      }
    });

    // 鼠标 + 触摸控制：直接设置 x 坐标，不用 reset()
    const movePaddleTo = (px: number) => {
      const x = Phaser.Math.Clamp(
        px,
        GAME_CONFIG.PADDLE_WIDTH / 2,
        GAME_CONFIG.WIDTH - GAME_CONFIG.PADDLE_WIDTH / 2
      );
      this.paddle.x = x;
      const body = this.paddle.body as Phaser.Physics.Arcade.Body;
      body.x = x - GAME_CONFIG.PADDLE_WIDTH / 2;
    };
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      movePaddleTo(pointer.x);
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      movePaddleTo(pointer.x);
    });
  }

  // ── 失去一条命 ───────────────────────────
  private loseLife() {
    this.lives -= 1;
    this.emitUI();

    if (this.lives <= 0) {
      this.gameOver();
      return;
    }

    // 重置小球位置
    this.ballLaunched = false;
    this.ball.setVelocity(0, 0);
    this.ball.setPosition(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT - 65
    );

    const hint = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      '点击重新发射',
      { fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace' }
    ).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      hint.destroy();
      this.launchBall();
    });
  }

  // ── 下一关 ───────────────────────────────
  private nextLevel() {
    this.level += 1;
    this.ballLaunched = false;
    this.ball.setVelocity(0, 0);
    this.ball.setPosition(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT - 65
    );
    this.brickDataMap.clear();
    this.bricks.clear(true, true);
    this.createBricks(this.getDefaultLevel());
    this.bricks.refresh();
    this.resetBrickCollider(); // ← 重新注册碰撞器，指向新的 group
    this.emitUI();

    const txt = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      `第 ${this.level} 关！`,
      { fontSize: '28px', color: '#ffd740', fontFamily: 'monospace' }
    ).setOrigin(0.5);
    this.time.delayedCall(1500, () => txt.destroy());

    this.input.once('pointerdown', () => this.launchBall());
  }

  // ── 游戏结束 ─────────────────────────────
  private gameOver() {
     this.ball.setVelocity(0, 0);
  this.scene.stop('UIScene');
  this.cameras.main.fadeOut(600, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('GameOverScene', {
      score: this.score,
      level: this.level,
    });
  });
    // this.ball.setVelocity(0, 0);
    // this.add.text(
    //   GAME_CONFIG.WIDTH / 2,
    //   GAME_CONFIG.HEIGHT / 2 - 20,
    //   'GAME OVER',
    //   { fontSize: '32px', color: '#ff4081', fontFamily: 'monospace' }
    // ).setOrigin(0.5);
    // this.add.text(
    //   GAME_CONFIG.WIDTH / 2,
    //   GAME_CONFIG.HEIGHT / 2 + 20,
    //   `最终得分: ${this.score}`,
    //   { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' }
    // ).setOrigin(0.5);

    // this.time.delayedCall(2000, () => {
    //   this.scene.restart();
    // });
  }

  // ── 工具方法 ─────────────────────────────
  private addScore(points: number) {
    this.score += points;
    this.emitUI();
  }

  private emitUI() {
    this.events.emit('update-ui', {
      score: this.score,
      lives: this.lives,
      level: this.level,
    });
  }

  update() {
    // 防止小球速度被物理引擎拖慢
    if (this.ballLaunched) {
      const body = this.ball.body as Phaser.Physics.Arcade.Body;
      const speed = body.speed;
      if (speed > 0 && Math.abs(speed - GAME_CONFIG.BALL_SPEED) > 10) {
        const scale = GAME_CONFIG.BALL_SPEED / speed;
        body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
      }
    }
  }
}