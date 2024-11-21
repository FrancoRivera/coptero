class Player {
    private dy = 0;
    private ddy = +0.4; // pixels acceleration

    constructor(public x: number, public y: number, public radius: number) { }

    update(frames: number) {
        if (keys.includes('Space')) {
            this.jump();
        }

        this.dy = this.dy + (this.ddy * frames / game.frameRate)
        this.y = this.y + this.dy
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    jump() {
        this.dy = (-this.ddy * 15);
    }
}


class Pipe {
    constructor(public x: number, public y: number,
        public width: number, public height: number) { }


    update(frames: number) {
        this.x -= 2 * frames / game.frameRate;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y, this.width, this.height);
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

    constructor() {
        this.canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
        if (this.canvas === null) {
            throw new Error('Canvas not found');
        }

        this.canvas.width = (window.innerHeight - 200) / 16 * 9;
        this.canvas.height = window.innerHeight - 200;

        this.ctx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.startGame();
    }

    startGame() {
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

        requestAnimationFrame(this.gameLoop.bind(this))
    }

    update(frames: number) {
        // update positions
        this.player.update(frames)

        if (this.player.y > this.height) {
            return;
        }

        this.pipes.forEach(pipe => {
            pipe.update(frames)
        });
        // check collisions and game over
    }

    gameLoop() {
        let now = performance.now();
        let dt = (now - this.lastFrameTime) / 1000;

        this.lastFrameTime = now;
        this.fps = 1 / dt;

        if (this.canvas == null) return;
        if (this.ctx === null) {
            throw new Error('Context not found');
        }
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.update(this.fps);

        this.player.render(this.ctx)
        this.pipes.forEach(pipe => {
            pipe.render(this.ctx);
        })

        requestAnimationFrame(this.gameLoop.bind(this))
    }
}


let keys: String[] = [];

document.addEventListener('mousedown', (event) => {
    keys.push('Space')
})

document.addEventListener('mouseup', (event) => {
    keys = keys.filter(key => key !== 'Space')
})

document.addEventListener("touchstart", (event) => {
    keys.push("Space");
});
document.addEventListener("touchend", (event) => {
    keys = keys.filter((key) => key !== "Space");
});


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