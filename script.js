export class mainMap extends Phaser.Scene {
    constructor() {
        super("mainMap");
    }

    preload() {
        this.load.tilemapTiledJSON('maps', 'src/assets/map.json');
        this.load.image('tiles', 'src/assets/tiles.png');
        this.load.image('player', 'src/assets/player.png');
        this.load.image('enemy', 'src/assets/enemy.png');
        this.load.image('glow', 'src/assets/glow.png');
    }

    create() {
        const map = this.add.tilemap('maps');
        const tiles = map.addTilesetImage('tileset', 'tiles');
        const groundLayer = map.createLayer('Map', tiles, 0, 0);
        const wallLayer = map.createLayer('Walls', tiles, 0, 0);

        groundLayer.setScale(15);
        wallLayer.setScale(15);

        this.player = this.physics.add.sprite(5300, 7500, 'player');
        this.player.setScale(0.1);
        this.player.setDepth(1);

        this.player.body.setCircle(this.player.width * 0.47, this.player.width * 0.06, this.player.height * 0.05);

        // Initialize HP
        this.hp = 250;
        this.currentHp = 200;

        // Create the fixed-position HP bar
        this.createHpBar();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(0.85);

        this.minimap = this.cameras.add(10, 10, 150, 150).setZoom(0.05).setName('mini');
        this.minimap.startFollow(this.player);
        this.minimap.setScroll(0, 0);
        this.cameras.main.ignore(this.minimap);

        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.player, this.enemies, this.handleCollision, null, this);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.enemies, wallLayer);
        this.physics.add.overlap(this.player, this.enemies, this.chasePlayer, null, this);
        wallLayer.setCollisionBetween(15, 16);
        this.physics.add.collider(this.player, wallLayer);

        this.time.addEvent({
            delay: 2000,
            callback: this.changeEnemiesDirection,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 2500,
            callback: this.attemptSpawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        const speed = 130;

        this.player.setVelocity(0);

        if (this.keys.w.isDown || this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.keys.s.isDown || this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        } else {
            this.player.setVelocityY(0);
        }

        if (this.keys.a.isDown || this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.keys.d.isDown || this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        this.enemies.getChildren().forEach(enemy => {
            let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            let chaseRange = 500;

            if (distance < chaseRange) {
                this.physics.moveToObject(enemy, this.player, 110);
            } else {
                enemy.setVelocity(enemy.wanderDirection.x * 50, enemy.wanderDirection.y * 50);
            }

            enemy.glow.x = enemy.x;
            enemy.glow.y = enemy.y;
        });

        // Update the HP bar
        this.updateHpBar();
    }

    createHpBar() {
        this.hpBarContainer = document.createElement('div');
        this.hpBarContainer.style.position = 'absolute';
        this.hpBarContainer.style.top = '20px';
        this.hpBarContainer.style.right = '20px';
        this.hpBarContainer.style.width = '250px';
        this.hpBarContainer.style.height = '30px';
        this.hpBarContainer.style.borderRadius = '30px';
        this.hpBarContainer.style.backgroundColor = '#000';
        this.hpBarContainer.style.padding = '5px';
        this.hpBarContainer.style.boxSizing = 'border-box';
        document.body.appendChild(this.hpBarContainer);
    
        this.hpBar = document.createElement('div');
        this.hpBar.style.height = '100%';
        this.hpBar.style.width = '100%';
        this.hpBar.style.borderRadius = '30px';
        this.hpBar.style.backgroundColor = '#ffe100';
        this.hpBar.style.boxSizing = 'border-box';
        this.hpBarContainer.appendChild(this.hpBar);

        this.updateHpBar();
    }

    updateHpBar() {
        const hpPercentage = this.currentHp / this.hp;
        this.hpBar.style.width = `${hpPercentage * 100}%`;
    }

    handleCollision(player, enemy) {
        if (!this.damageCooldown) {
            this.takeDamage(50);
            this.player.setTint(0xff0000);
            this.time.delayedCall(100, () => {
                this.player.clearTint();
            });

            this.damageCooldown = true;
            this.time.delayedCall(500, () => {
                this.damageCooldown = false;
            });
        }
    }

    takeDamage(amount) {
        this.currentHp = Phaser.Math.Clamp(this.currentHp - amount, 0, this.hp);
        this.smoothHpBarDecrease();
        if (this.currentHp <= 0) {
            this.respawnPlayer();
        }
    }

    smoothHpBarDecrease() {
        const hpPercentage = this.currentHp / this.hp;
        this.tweens.add({
            targets: this.hpBar,
            width: `${hpPercentage * 100}%`,
            duration: 500,
            ease: 'Power2'
        });
    }

    respawnPlayer() {
        this.player.setPosition(5300, 7500);
        this.currentHp = this.hp;
        this.smoothHpBarDecrease();
    }



    changeDirection(enemy) {
        const directions = [
            new Phaser.Math.Vector2(1, 0),
            new Phaser.Math.Vector2(-1, 0),
            new Phaser.Math.Vector2(0, 1),
            new Phaser.Math.Vector2(0, -1),
            new Phaser.Math.Vector2(1, 1).normalize(),
            new Phaser.Math.Vector2(-1, -1).normalize(),
            new Phaser.Math.Vector2(-1, 1).normalize(),
            new Phaser.Math.Vector2(1, -1).normalize()
        ];

        enemy.wanderDirection = Phaser.Utils.Array.GetRandom(directions);
    }

    changeEnemiesDirection() {
        this.enemies.getChildren().forEach(enemy => {
            this.changeDirection(enemy);
        });
    }

    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            let x = Phaser.Math.Between(4000, 6000);
            let y = Phaser.Math.Between(6200, 8000);

            let enemy = this.physics.add.sprite(x, y, 'enemy');
            enemy.setScale(0.3);
            enemy.setDepth(1);

            enemy.body.setCircle(enemy.width * 0.37, enemy.width * 0.13, enemy.height * 0.13);

            enemy.wanderDirection = new Phaser.Math.Vector2(0, 0);
            this.changeDirection(enemy);

            let glow = this.add.sprite(enemy.x, enemy.y, 'glow');
            glow.setScale(0.7);
            glow.setTint(0xFFFF00);
            glow.setDepth(0);
            this.tweens.add({
                targets: glow,
                scale: { from: 0.15, to: 0.2 },
                duration: 2000,
                yoyo: true,
                repeat: -1
            });

            enemy.glow = glow;

            this.tweens.add({
                targets: enemy,
                angle: 360,
                duration: 30000,
                repeat: -1
            });

            this.enemies.add(enemy);
        }
    }

    attemptSpawnEnemy() {
        if (Phaser.Math.Between(1, 2) === 1) {
            this.spawnEnemies(1);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    scene: mainMap,
    physics: {
        default: 'arcade',
        arcade: {
            fps: 60,
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

export default mainMap;
