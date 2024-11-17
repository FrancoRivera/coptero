function drawImage(ctx, img, x, y, angle = 0, scale = 1) {
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
    constructor(public x: number, public y: number, public dx: number, public dy: number, public radius: number){}
    
    update(frames: number){
        this.x += this.dx * frames / frameRate;
        this.y += this.dy * frames / frameRate;

        this.age -= 1;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `hsl(100 100% 50% / ${this.age}%)`;
        ctx.beginPath();
        ctx.arc(this.x-10, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
} 

class Player {
    // private dx = 0;
    private dy = 0;
    // private ddx = 0
    private ddy = +0.2; // pixels acceleration

    private rotation = 0;
    particles: Particle[]

    constructor(public x: number, public y: number, public radius: number){
        this.particles = []

        for (let i = 0; i < 10; i++){
            let dx = Math.random() - 2;
            let dy = Math.random() * 2 - 1;
            let particle = new Particle(x, y, dx, dy, 2)
            this.particles.push(particle)
        }
    }

    update(frames: number){

        if (keys.includes('Space')){
            this.jump();
        }

        // const seconds = frames / frameRate;
        this.dy = this.dy + (this.ddy * frames / frameRate)
        this.y = this.y + this.dy
        this.rotation += 1;

        this.particles.forEach(particle => {
            particle.update(frames)
        })

        // check if particles x position is less than 0, if it is then remove them
        for (let i = 0; i < this.particles.length; i++){
            let particle = this.particles[i];
            if (particle.age <= 0){
                this.particles.splice(i, 1)
            }
        }
        console.log(this.particles.length)

    }

    render(ctx: CanvasRenderingContext2D) {
        drawImage(ctx, playerImg, this.x, this.y, this.rotation * Math.PI / 180, 2);

        this.particles.forEach(particle => {
            particle.render(ctx)
        });
    }

    jump(){
        this.rotation = -30
        this.dy = (-this.ddy * 15);


        for (let i = 0; i < 50; i++){
            let dx = Math.random() - 2;
            let dy = Math.random() * 2 - 1;
            let particle = new Particle(this.x, this.y, dx, dy, 2)
            this.particles.push(particle)
        }
    }
}


class Pipe {
    constructor(public x: number, public y: number,
        public width: number, public height: number){}

    update(frames: number){
        this.x -= 2 * frames / frameRate;
    }

    render(ctx: CanvasRenderingContext2D) {
        // split pipes into chunks of 32 in height

        for (let i = 0; i < this.height; i += 32){
            ctx.drawImage(wall, 0, 0, 32, 32, this.x, this.y + i, this.width, 32);
        }
    }
}

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
        let downPipe = new Pipe(xCord, height - barHeight + offset, barWidth, barHeight - offset)

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
        event.preventDefault();
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

    if (fpsCtx === null) {
        throw new Error('Context not found');
    }

    let data = fpsCtx.getImageData(0, 0, fpsCanvas.width, fpsCanvas.height);

    fpsCtx.clearRect(0, 0, fpsCanvas.width, fpsCanvas.height);

    // draw the data shifted 1 pixel to the left
    fpsCtx.putImageData(data, -1, 0);
    
    fpsCtx.fillStyle = 'rgb(147 197 253)';
    fpsCtx.fillRect(fpsCanvas.width-1, fpsCanvas.height-fps, 1, fps);
    fpsEl!.innerHTML = `FPS: ${Math.round(fps)}`, fpsCanvas.width - 100, 50

    // document.getElementById('fps')!.innerText = `FPS: ${Math.round(fps)}`;


    let score = (now - startTime) / 1000;
    document.getElementById('score')!.innerText = `Score: ${Math.round(score)}`;

    if (canvas == null) return;



    if (ctx === null) {
        throw new Error('Context not found');
    }
    ctx.clearRect(0, 0, width, height);

    //drawImage(ctx, bg, this.x, this.y, this.rotation * Math.PI / 180, 2);
    let offset = (now - startTime) / 1000 * 100;
    ctx.drawImage(bg, 0+offset, 0, 720, 1280, 0, 0, canvas.width, canvas.height);

    // let deltaTime = now - lastFrameTime;

    update(fps);
    if (gameOver){
        // let ok = confirm('Game Over')
        // if (ok) {
        //     startGame();
        // }
        return;
    }
    player.render(ctx)
    pipes.forEach(pipe => {
        pipe.render(ctx);
    })
    requestAnimationFrame(gameLoop)
}


let canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
if (canvas === null) {
    throw new Error('Canvas not found');
}

canvas.width = (window.innerHeight - 200) / 16 * 9;
canvas.height = window.innerHeight - 200;

// Get the DPR and size of the canvas
const dpr = window.devicePixelRatio;
const rect = canvas.getBoundingClientRect();

// Set the "actual" size of the canvas
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

let fpsCanvas = document.querySelector('#fpsCanvas') as HTMLCanvasElement;
let fpsEl = document.querySelector('#fps');
let fpsCtx = fpsCanvas.getContext('2d');
let ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

// Scale the context to ensure correct drawing operations
ctx.scale(dpr, dpr);

// Set the "drawn" size of the canvas
canvas.style.width = `${rect.width}px`;
canvas.style.height = `${rect.height}px`;

let width = canvas.width;
let height = canvas.height;

const frameRate = 60;

let playerImg = new Image();
playerImg.src = '/img/player.png';

let bg = new Image();
bg.src = '/img/machu-picchu.png';

let wall = new Image();
wall.src = '/img/wall.png';


let player: Player;

let minGap = 100;

// generate pipes
let pipes: Pipe[] = []

let fps = 0;
let lastFrameTime = 0;
let startTime = performance.now();
let gameOver = false;

startGame();
