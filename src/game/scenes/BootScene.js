import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Tải assets ở đây nếu có ảnh tĩnh. Hiện tại dùng vector graphics nên không cần tải nhiều.
  }

  create() {
    this.scene.start('LudoScene');
  }
}
