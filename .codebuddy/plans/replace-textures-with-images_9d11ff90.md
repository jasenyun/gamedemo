---
name: replace-textures-with-images
overview: 将打砖块游戏的 generateTexture 纹理替换为真实图片资源，新增 StartScene 开始场景，更新场景顺序，确保移动端触摸控制
todos:
  - id: modify-bootscene
    content: 修改 BootScene.ts：preload 用 this.load.image 加载 6 张图片，移除 generateTexture，create 启动 StartScene
    status: completed
  - id: create-startscene
    content: 新建 StartScene.ts：黑色背景 + 游戏名 + 点击开始，点击后跳转 GameScene
    status: completed
  - id: modify-gamescene
    content: 修改 GameScene.ts：添加 bg 背景图，setupInput 增加 pointerdown 触摸移动挡板
    status: completed
    dependencies:
      - modify-bootscene
  - id: modify-main
    content: 修改 main.ts：导入 StartScene，场景顺序改为 [BootScene, StartScene, GameScene, UIScene]
    status: completed
    dependencies:
      - create-startscene
---

## 产品概述

将打砖块游戏从 generateTexture 生成纹理切换为真实图片资源，新增开始界面，优化移动端触控体验。

## 核心功能

- BootScene 加载 public/assets/ 下全部 6 张图片资源（paddle.png, ball.png, brick_normal.png, brick_steel.png, brick_explosive.png, bg.png）
- 移除 BootScene 中所有 generateTexture 代码，改为 this.load.image 加载
- GameScene 添加 bg 背景图，增强移动端触摸控制（pointerdown 时也能移动挡板到触摸位置，避免触控与发射球冲突）
- 新增 StartScene：黑色背景 + 游戏名"打砖块" + "点击开始"按钮，点击后进入 GameScene
- main.ts 场景顺序改为 [BootScene, StartScene, GameScene, UIScene]

## 技术栈

- 框架：Phaser 4 + TypeScript + Vite（沿用现有项目）
- 资源路径：public/assets/ 下的图片通过 `assets/xxx.png` 相对路径加载

## 实现方案

### 整体策略

1. BootScene 的 preload() 中用 this.load.image() 替换全部 generateTexture，纹理 key 保持不变（paddle/ball/brick_normal/brick_steel/brick_explosive），GameScene 无需修改纹理引用。新增 bg key 加载背景图。
2. BootScene 的 create() 中 this.scene.start('GameScene') 改为 this.scene.start('StartScene')。
3. 新建 StartScene，黑色背景，居中显示游戏名和"点击开始"文字，点击后跳转 GameScene。
4. GameScene 添加背景图（this.add.image 在最底层），并优化移动端触控：增加 pointerdown 事件处理，触摸按下时也移动挡板到触摸位置。
5. main.ts 场景数组增加 StartScene。

### 关键技术决策

- **纹理 key 一致性**：BootScene 加载图片时使用的 key 与原 generateTexture 的 key 完全一致，确保 GameScene 零改动即可工作。
- **移动端触控优化**：当前 pointermove 只在手指移动时触发，首次触摸按下时不移动挡板。需要在 pointerdown 事件中也添加挡板跟随逻辑，并确保 pointerdown 不与发射球冲突——通过检查 ballLaunched 状态，球未发射时 pointerdown 先移动挡板再发射，球已发射后 pointerdown 只移动挡板。
- **背景图**：在 GameScene.create() 最开头添加 bg 图片，设置 setDisplaySize 铺满画布，置于最底层（setDepth(0)），其他游戏对象默认 depth 即可覆盖其上。

## 实现备注

- 图片资源在 public/assets/ 目录下，Phaser 通过 Vite 开发服务器访问时路径为 `assets/xxx.png`（相对于 public 根目录）。
- GameScene 的 setupInput 中 pointerdown 与发射球的交互需谨慎处理：create() 中的 this.input.once('pointerdown') 用于首次发射，loseLife() 中同理；而持续触摸移动挡板需要 on('pointerdown') 事件。解决方案：在 setupInput 的 pointermove 回调中同时处理 pointerdown（移动挡板），发射球逻辑保持 pointerdown/keydown-SPACE 不变，因为 pointerdown 同时触发两个监听器（发射球 + 移动挡板）是可接受的——用户点击时发射球并同时移动挡板到点击位置是合理的交互。
- BootScene 加载 bg.png 使用 key `'bg'`，GameScene 中通过 `this.add.image(GAME_CONFIG.WIDTH/2, GAME_CONFIG.HEIGHT/2, 'bg')` 添加。

## 目录结构

```
src/
├── main.ts                    # [MODIFY] 场景顺序增加 StartScene
├── config.ts                  # 不修改
├── scenes/
│   ├── BootScene.ts           # [MODIFY] preload() 改为 this.load.image 加载 6 张图片，移除所有 generateTexture 代码；create() 改为启动 StartScene
│   ├── StartScene.ts          # [NEW] 开始场景：黑色背景 + 游戏名 + 点击开始按钮
│   ├── GameScene.ts           # [MODIFY] create() 添加 bg 背景图；setupInput() 增加 pointerdown 触摸移动挡板支持
│   └── UIScene.ts             # 不修改
```

## 关键代码结构

```typescript
// BootScene.ts - preload 加载资源
preload() {
  this.load.image('paddle', 'assets/paddle.png');
  this.load.image('ball', 'assets/ball.png');
  this.load.image('brick_normal', 'assets/brick_normal.png');
  this.load.image('brick_steel', 'assets/brick_steel.png');
  this.load.image('brick_explosive', 'assets/brick_explosive.png');
  this.load.image('bg', 'assets/bg.png');
}

// StartScene.ts - 核心结构
export class StartScene extends Phaser.Scene {
  constructor() { super({ key: 'StartScene' }); }
  create() {
    // 黑色背景（默认）
    // 居中显示游戏名"打砖块"
    // 居中显示"点击开始"
    // pointerdown → this.scene.start('GameScene')
  }
}

// GameScene.ts - setupInput 增加触摸支持
this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
  this.paddle.x = Phaser.Math.Clamp(p.x, ...);
  this.paddle.body.reset(this.paddle.x, this.paddle.y);
});
```