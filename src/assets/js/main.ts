function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, angle = 0, scale = 1) {
    let scale_half = scale / 2;
    x -= img.width * scale_half;
    y -= img.height * scale_half;

    ctx.save();
    ctx.translate(x + img.width * scale_half, y + img.height * scale_half);
    ctx.rotate(angle);
    ctx.translate(- x - img.width * scale_half, - y - img.height * scale_half);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    ctx.restore();
}



class Particle {
    public age = 100;
    constructor(public x: number, public y: number, public dx: number, public dy: number, public radius: number) { }

    update(frames: number) {
        this.x += this.dx * frames / game.frameRate;
        this.y += this.dy * frames / game.frameRate;

        this.age -= 1;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `hsl(100 100% 50% / ${this.age}%)`;
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class Player {
    // private dx = 0;
    private dy = 0;
    // private ddx = 0
    private ddy = +0.4; // pixels acceleration

    private rotation = 0;
    particles: Particle[]

    constructor(public x: number, public y: number, public radius: number) {
        this.particles = []

        for (let i = 0; i < 10; i++) {
            let dx = Math.random() - 2;
            let dy = Math.random() * 2 - 1;
            let particle = new Particle(x, y, dx, dy, 2)
            this.particles.push(particle)
        }
    }

    update(frames: number) {

        if (keys.includes('Space')) {
            this.jump();
        }

        // const seconds = frames / frameRate;
        this.dy = this.dy + (this.ddy * frames / game.frameRate)
        this.y = this.y + this.dy
        //this.rotation += 1;

        this.particles.forEach(particle => {
            particle.update(frames)
        })

        // check if particles x position is less than 0, if it is then remove them
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];
            if (particle.age <= 0) {
                this.particles.splice(i, 1)
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        drawImage(ctx, game.playerImg, this.x, this.y, this.rotation * Math.PI / 180, 1);

        this.particles.forEach(particle => {
            particle.render(ctx)
        });
    }

    jump() {
        game.jumpSound.play();

        //this.rotation = -30
        this.dy = (-this.ddy * 15);


        for (let i = 0; i < 50; i++) {
            let dx = Math.random() - 2;
            let dy = Math.random() * 2 - 1;
            let particle = new Particle(this.x, this.y, dx, dy, 2)
            this.particles.push(particle)
        }
    }
}


class Pipe {
    constructor(public x: number, public y: number,
        public width: number, public height: number) { }

    update(frames: number) {
        this.x -= 2 * frames / game.frameRate;
    }

    render(ctx: CanvasRenderingContext2D) {
        // split pipes into chunks of 32 in height
        const fullBlocks = Math.floor(this.height / 32);
        const remainder = this.height % 32;

        for (let i = 0; i < fullBlocks; i++) {
            ctx.drawImage(game.wall, 0, 0, 32, 32, this.x, this.y + i * 32, this.width, 32);
        }

        if (remainder > 0) {
            ctx.drawImage(game.wall, 0, 0, 32, remainder, this.x, this.y + (fullBlocks * 32), this.width, remainder);
        }
    }
}

class Coptero {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    frameRate = 60;
    player: Player;
    minGap = 100;

    // generate pipes
    pipes: Pipe[] = []

    fps = 0;
    lastFrameTime = 0;
    startTime = performance.now();
    gameOver = false;

    fpsEl = document.querySelector('#fps');
    fpsCanvas: HTMLCanvasElement;
    fpsCtx: CanvasRenderingContext2D;

    playerImg: HTMLImageElement;
    bg: HTMLImageElement;
    wall: HTMLImageElement;

    jumpSound = new Audio('/audio/jump.wav');
    gameOverSound = new Audio('/audio/explosion.wav');
    coinSound = new Audio('/audio/coin.wav');
    backgroundMusic = new Audio('/audio/background.wav');

    constructor() {
        this.canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
        if (this.canvas === null) {
            throw new Error('Canvas not found');
        }

        this.canvas.width = (window.innerHeight - 200) / 16 * 9;
        this.canvas.height = window.innerHeight - 200;

        this.fpsCanvas = document.querySelector('#fpsCanvas') as HTMLCanvasElement;
        this.fpsCtx = this.fpsCanvas.getContext('2d') as CanvasRenderingContext2D;
        this.ctx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

        this.width = this.canvas.width;
        this.height = this.canvas.height;


        this.playerImg = new Image();
        this.playerImg.src = '/img/player.png';

        this.bg = new Image();
        this.bg.src = '/img/machu-picchu.png';

        this.wall = new Image();
        this.wall.src = '/img/wall.png';

        let musicCheckbox = document.querySelector('#backgroundMusic') as HTMLInputElement;
        musicCheckbox.checked = true;
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.1;


        let text = "Toca para comenzar"
        this.ctx.fillStyle = 'white';
        this.ctx.font = '32px Arial'
        let fontWidth = this.ctx.measureText(text).width;
        this.ctx.fillText(text, (this.width / 2) - (fontWidth / 2), this.height / 2 - 100)

        musicCheckbox.addEventListener('change', (event) => {
            if (musicCheckbox.checked) {
                this.backgroundMusic.play();
            } else {
                this.backgroundMusic.pause();
            }
        })
        
        this.canvas.addEventListener("click", (event) => {
            this.backgroundMusic.play();

            this.startGame();
        }, { once: true });
    }

    startGame() {
        // remove events
        let touchStart = 0;
        this.canvas.removeEventListener("touchstart", (event) => {
            touchStart = performance.now();
        })
        this.canvas.removeEventListener("touchend", (event) => {
            let touchEnd = performance.now();
            if (touchEnd - touchStart > 1000) {
                this.startGame();
            }
        })

        this.startTime = performance.now();
        this.player = new Player(this.width / 3, this.height / 2, 16)

        this.pipes = []
        for (var i = 0; i < 100; i++) {
            const horizontalGap = 150;
            let xCord = this.width + i * horizontalGap;
            let gapBetweenBars = 150 - (i * 2);
            let barHeight = this.height / 2 - gapBetweenBars / 2;

            let offset = Math.random() * 100 - 50

            let barWidth = 35;
            let pipe = new Pipe(xCord, 0, barWidth, barHeight + offset)
            let downPipe = new Pipe(xCord, this.height - barHeight + offset, barWidth, barHeight - offset)

            this.pipes.push(pipe)
            this.pipes.push(downPipe)
        }
        this.gameOver = false;

        requestAnimationFrame(this.gameLoop.bind(this))
    }

    update(frames: number) {
        // update positions
        this.player.update(frames)

        if (this.player.y > this.height) {
            this.gameOver = true;
            return;
        }

        this.pipes.forEach(pipe => {
            pipe.update(frames)
            if (colliding(this.player, pipe)) {
                this.gameOver = true;
                return;
            }
        });
        // check collisions and game over
    }

    gameLoop() {
        if (this.gameOver) {
            // let ok = confirm('Game Over')
            // if (ok) {
            //     startGame();
            // }
            this.GameOver();
            return;
        }

        let now = performance.now();
        let dt = (now - this.lastFrameTime) / 1000;

        // if (dt < 1 / frameRate) {
        //     requestAnimationFrame(gameLoop);
        //     return;
        // }
        this.lastFrameTime = now;
        this.fps = 1 / dt;

        if (this.fpsCtx === null) {
            throw new Error('Context not found');
        }

        let data = this.fpsCtx.getImageData(0, 0, this.fpsCanvas.width, this.fpsCanvas.height);

        this.fpsCtx.clearRect(0, 0, this.fpsCanvas.width, this.fpsCanvas.height);

        // draw the data shifted 1 pixel to the left
        this.fpsCtx.putImageData(data, -1, 0);

        this.fpsCtx.fillStyle = 'rgb(147 197 253)';
        this.fpsCtx.fillRect(this.fpsCanvas.width - 1, this.fpsCanvas.height - this.fps, 1, this.fps);
        this.fpsEl!.innerHTML = `FPS: ${Math.round(this.fps)}`, this.fpsCanvas.width - 100, 50

        // document.getElementById('fps')!.innerText = `FPS: ${Math.round(fps)}`;


        let score = (now - this.startTime) / 1000;
        document.getElementById('score')!.innerText = `${Math.round(score)}`;

        if (this.canvas == null) return;
        if (this.ctx === null) {
            throw new Error('Context not found');
        }
        this.ctx.clearRect(0, 0, this.width, this.height);

        //drawImage(ctx, bg, this.x, this.y, this.rotation * Math.PI / 180, 2);
        let offset = (now - this.startTime) / 1000 * 100;
        this.ctx.drawImage(this.bg, 0 + offset, 0, 720, 1280, 0, 0, this.canvas.width, this.canvas.height);

        // let deltaTime = now - lastFrameTime;

        this.update(this.fps);
      
        this.player.render(this.ctx)
        this.pipes.forEach(pipe => {
            pipe.render(this.ctx);
        })

        requestAnimationFrame(this.gameLoop.bind(this))
    }

    GameOver() {
        this.gameOverSound.play();

        this.ctx.fillStyle = 'black';
        this.ctx.font = '48px mono'

        let fontWidth = this.ctx.measureText('Game Over').width;
        this.ctx.fillText('Game Over', (this.width / 2) - (fontWidth / 2), this.height / 2 - 100)

        // create a button and place it in the middle of the screen
        let button = document.querySelector('#restartButton') as HTMLButtonElement;
        button.style.display = 'block';
        button.onclick = () => {
            this.startGame();
            // hide the button
            button.style.display = 'none';
        }
    }
}


function colliding(player: Player, pipe: Pipe): boolean {
    let rightSidePlayer = player.x + player.radius
    let leftSidePlayer = player.x - player.radius
    let collidingX = (
        // right side of player
        (rightSidePlayer > pipe.x && rightSidePlayer < pipe.x + pipe.width) ||
        // left side of player
        (leftSidePlayer > pipe.x && leftSidePlayer < pipe.x + pipe.width)
    )
    if (!collidingX) {
        return false;
    }

    let topSidePlayer = player.y - player.radius
    let bottomSidePlayer = player.y + player.radius
    let collidingY = (
        // top side of player
        (topSidePlayer < pipe.y + pipe.height && topSidePlayer > pipe.y) ||
        // bottom side of player
        (bottomSidePlayer > pipe.y && bottomSidePlayer < pipe.y + pipe.height)
    )
    if (!collidingY) {
        return false;
    }

    return true;
}

let keys: String[] = [];

document.addEventListener('mousedown', (event) => {
    keys.push('Space')
})

document.addEventListener('mouseup', (event) => {
    keys = keys.filter(key => key !== 'Space')
})

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        keys.push('Space')
        event.preventDefault();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        keys = keys.filter(key => key !== 'Space')
    }
});


let game = new Coptero();
