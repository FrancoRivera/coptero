let canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
if (canvas === null) {
    throw new Error('Canvas not found');
}

canvas.width = (window.innerHeight - 100) / 16 * 9;
canvas.height = window.innerHeight - 100;

let width = canvas.width;
let height = canvas.height;

const frameRate = 60;

class Player {
    // private dx = 0;
    private dy = 0;
    // private ddx = 0
    private ddy = +0.2; // pixels acceleration

    constructor(public x: number, public y: number, public radius: number){}

    update(frames: number){

        if (keys.includes('Space')){
            this.jump();
        }

        // const seconds = frames / frameRate;
        this.dy = this.dy + (this.ddy * frames / frameRate)
        this.y = this.y + this.dy
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
        ctx.fillStyle = 'red'
        ctx.fill()
    }

    jump(){
        this.dy = (-this.ddy * 15);
    }
}


class Pipe {
    constructor(public x: number, public y: number,
        public width: number, public height: number){}

    update(frames: number){
        this.x -= 2 * frames / frameRate;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.fillStyle = 'blue'
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}

let player: Player;

let minGap = 100;

// generate pipes
let pipes: Pipe[] = []

let fps = 0;
let lastFrameTime = 0;
let startTime = performance.now();
let gameOver = false;

startGame();

function startGame(){
    startTime = performance.now();
    player = new Player(width/3, height/2, 25)

    pipes = []
    for (var i = 0; i < 100; i++) {
        let xCord = width + i * 100
        let gapBetweenBars = 300 - (i * 5);
        let barHeight = height/2 - gapBetweenBars/2;

        let offset = Math.random() * 100 - 50

        let barWidth = 35;
        let pipe = new Pipe(xCord, 0, barWidth, barHeight + offset)
        let downPipe = new Pipe(xCord, height - barHeight, barWidth, barHeight - offset)

        pipes.push(pipe)
        pipes.push(downPipe)
    }
    gameOver = false;

    requestAnimationFrame(gameLoop)
}



function collding(player: Player, pipe: Pipe) : boolean{
    let rightSidePlayer = player.x + player.radius
    let leftSidePlayer = player.x - player.radius
    let collidingX = (
        // right side of player
        (rightSidePlayer > pipe.x && rightSidePlayer < pipe.x + pipe.width) ||
        // left side of player
        (leftSidePlayer > pipe.x && leftSidePlayer < pipe.x + pipe.width)
    )
    if (!collidingX){
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
    if (!collidingY){
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
    if (event.code === 'Space'){
        keys.push('Space')
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'Space'){
        keys = keys.filter(key => key !== 'Space')
    }
});


function update(frames: number){
    // update positions
    player.update(frames)

    if (player.y > height){
        gameOver = true;
        return;
    }

    pipes.forEach(pipe => {
        pipe.update(frames)
        if (collding(player, pipe)){
            gameOver = true;
            return;
        }
    });
    // check collisions and game over
}

function gameLoop() {
    let now = performance.now();
    let dt = (now - lastFrameTime) / 1000;

    // if (dt < 1 / frameRate) {
    //     requestAnimationFrame(gameLoop);
    //     return;
    // }
    lastFrameTime = now;
    fps = 1 / dt;

    document.getElementById('fps')!.innerText = `FPS: ${Math.round(fps)}`;
    let score = (now - startTime) / 1000;
    document.getElementById('score')!.innerText = `Score: ${Math.round(score)}`;

    let ctx = canvas.getContext('2d');

    if (ctx === null) {
        throw new Error('Context not found');
    }
    ctx.clearRect(0, 0, width, height);

    // let deltaTime = now - lastFrameTime;

    update(fps);
    if (gameOver){
        let ok = confirm('Game Over')
        if (ok) {
            startGame();
        }
        return;
    }
    player.render(ctx)
    pipes.forEach(pipe => {
        pipe.render(ctx);
    })
    requestAnimationFrame(gameLoop)
}
