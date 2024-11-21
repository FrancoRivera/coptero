// src/assets/js/main.ts
function drawImage(ctx, img, x, y, angle = 0, scale = 1) {
  let scale_half = scale / 2;
  x -= img.width * scale_half;
  y -= img.height * scale_half;
  ctx.save();
  ctx.translate(x + img.width * scale_half, y + img.height * scale_half);
  ctx.rotate(angle);
  ctx.translate(-x - img.width * scale_half, -y - img.height * scale_half);
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  ctx.restore();
}
function colliding(player, pipe) {
  let rightSidePlayer = player.x + player.radius;
  let leftSidePlayer = player.x - player.radius;
  let collidingX = rightSidePlayer > pipe.x && rightSidePlayer < pipe.x + pipe.width || leftSidePlayer > pipe.x && leftSidePlayer < pipe.x + pipe.width;
  if (!collidingX) {
    return false;
  }
  let topSidePlayer = player.y - player.radius;
  let bottomSidePlayer = player.y + player.radius;
  let collidingY = topSidePlayer < pipe.y + pipe.height && topSidePlayer > pipe.y || bottomSidePlayer > pipe.y && bottomSidePlayer < pipe.y + pipe.height;
  if (!collidingY) {
    return false;
  }
  return true;
}

class Particle {
  x;
  y;
  dx;
  dy;
  radius;
  age = 100;
  hue = 0;
  constructor(x, y, dx, dy, radius) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
    this.hue = Math.random() * 100 + 30;
  }
  update(deltaTime) {
    this.x += this.dx * deltaTime * game.frameRate;
    this.y += this.dy * deltaTime * game.frameRate;
    this.age -= 2;
    this.radius += 0.1;
  }
  render(ctx) {
    ctx.fillStyle = `hsl(${this.hue} 100% 90% / ${this.age}%)`;
    ctx.beginPath();
    ctx.arc(this.x - 10, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class Player {
  x;
  y;
  radius;
  dy = 1;
  ddy = 1000;
  rotation = 0;
  particles;
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.particles = [];
    for (let i = 0;i < 10; i++) {
      let dx = Math.random() - 2;
      let dy = Math.random() * 2 - 1;
      let particle = new Particle(x, y, dx, dy, 2);
      this.particles.push(particle);
    }
  }
  update(deltaTime) {
    if (keys.includes("Space")) {
      this.jump();
    }
    let oldDy = this.dy;
    this.dy = this.dy + this.ddy * deltaTime;
    this.y = oldDy * deltaTime + 0.5 * (this.dy - oldDy) * deltaTime + this.y;
    this.rotation += 1;
    this.particles.forEach((particle) => {
      particle.update(deltaTime);
    });
    for (let i = 0;i < this.particles.length; i++) {
      let particle = this.particles[i];
      if (particle.age <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  render(ctx) {
    drawImage(ctx, game.playerImg, this.x, this.y, this.rotation * Math.PI / 180, 1);
    this.particles.forEach((particle) => {
      particle.render(ctx);
    });
  }
  jump() {
    this.rotation = -30;
    this.dy = -300;
    let particleCount = 50;
    if (window.innerWidth > 600) {
      particleCount = 20;
    }
    for (let i = 0;i < particleCount; i++) {
      let dx = Math.random() * 2 - 4;
      let dy = Math.random() * 2 + 1;
      let particle = new Particle(this.x, this.y, dx, dy, 2);
      this.particles.push(particle);
    }
  }
}

class Pipe {
  x;
  y;
  height;
  width = 32;
  constructor(x, y, height) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = 32;
  }
  update(deltaTime) {
    this.x -= 2 * (deltaTime * game.frameRate);
  }
  render(ctx) {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    let blockWidth = 32;
    const fullBlocks = Math.floor(this.height / blockWidth);
    const remainder = this.height % blockWidth;
    for (let i = 0;i < fullBlocks; i++) {
      ctx.drawImage(game.wall, 0, 0, 32, 32, this.x, this.y + i * blockWidth, this.width, blockWidth);
    }
    if (remainder > 0) {
      ctx.drawImage(game.wall, 0, 0, 32, remainder, this.x, this.y + fullBlocks * blockWidth, this.width, remainder);
    }
  }
}

class Coptero {
  canvas;
  ctx;
  width;
  height;
  frameRate = 60;
  player;
  minGap = 100;
  pipes = [];
  fps = 0;
  lastFrameTime = 1;
  startTime = performance.now();
  gameOver = false;
  fpsEl = document.querySelector("#fps");
  fpsCanvas;
  fpsCtx;
  playerImg;
  bg;
  wall;
  jumpSound = new Audio(basePath + "audio/jump.wav");
  gameOverSound = new Audio(basePath + "audio/explosion.wav");
  coinSound = new Audio(basePath + "audio/coin.wav");
  backgroundMusic = new Audio(basePath + "audio/background.wav");
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    if (this.canvas === null) {
      throw new Error("Canvas not found");
    }
    this.canvas.width = (window.innerHeight - 200) / 16 * 9;
    this.canvas.height = window.innerHeight - 200;
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.fpsCanvas = document.querySelector("#fpsCanvas");
    this.fpsCtx = this.fpsCanvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.playerImg = new Image;
    this.playerImg.src = basePath + "img/player.png";
    this.bg = new Image;
    this.bg.src = basePath + "img/machu-picchu.png";
    this.wall = new Image;
    this.wall.src = basePath + "img/wall.png";
    let musicCheckbox = document.querySelector("#backgroundMusic");
    musicCheckbox.checked = true;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.1;
    this.ctx.fillStyle = "white";
    let fontSize = 32;
    fontSize = Math.min(fontSize, this.width / 10);
    this.ctx.font = fontSize + "px 'Press Start 2P'";
    let text = "Toca";
    let fontWidth = this.ctx.measureText(text).width;
    this.ctx.fillText(text, this.width / 2 - fontWidth / 2, this.height / 2 - 100);
    text = "para";
    fontWidth = this.ctx.measureText(text).width;
    this.ctx.fillText(text, this.width / 2 - fontWidth / 2, this.height / 2 - 0);
    text = "Comenzar";
    fontWidth = this.ctx.measureText(text).width;
    this.ctx.fillText(text, this.width / 2 - fontWidth / 2, this.height / 2 + 100);
    musicCheckbox.addEventListener("change", (event) => {
      if (musicCheckbox.checked) {
        this.backgroundMusic.play();
      } else {
        this.backgroundMusic.pause();
      }
    });
    this.canvas.addEventListener("click", (event) => {
      if (window.innerWidth > 600) {
        this.backgroundMusic.play();
      }
      this.startGame();
    }, { once: true });
  }
  startGame() {
    let now = performance.now();
    this.lastFrameTime = now;
    this.startTime = performance.now();
    this.player = new Player(this.width / 3, this.height / 2, 16);
    this.player.jump();
    this.player.jump();
    this.player.jump();
    this.pipes = [];
    for (var i = 0;i < 100; i++) {
      const horizontalGap = 250;
      let xCord = this.width + i * horizontalGap;
      let gapBetweenBars = 150 - i * 2;
      let barHeight = this.height / 2 - gapBetweenBars / 2;
      let offset = Math.random() * 100 - 50;
      let pipe = new Pipe(xCord, 0, barHeight + offset);
      let downPipe = new Pipe(xCord, this.height - barHeight + offset, barHeight - offset);
      this.pipes.push(pipe);
      this.pipes.push(downPipe);
    }
    this.gameOver = false;
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  update(deltaTime) {
    this.player.update(deltaTime);
    if (this.player.y > this.height) {
      this.gameOver = true;
      return;
    }
    this.pipes.forEach((pipe) => {
      pipe.update(deltaTime);
      if (colliding(this.player, pipe)) {
        this.gameOver = true;
        return;
      }
    });
  }
  gameLoop() {
    if (this.gameOver) {
      this.GameOver();
      return;
    }
    let now = performance.now();
    let dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    this.fps = 1 / dt;
    if (this.fpsCtx === null) {
      throw new Error("Context not found");
    }
    let data = this.fpsCtx.getImageData(0, 0, this.fpsCanvas.width, this.fpsCanvas.height);
    this.fpsCtx.clearRect(0, 0, this.fpsCanvas.width, this.fpsCanvas.height);
    this.fpsCtx.putImageData(data, -1, 0);
    this.fpsCtx.fillStyle = "rgb(147 197 253)";
    this.fpsCtx.fillRect(this.fpsCanvas.width - 1, this.fpsCanvas.height - this.fps, 1, this.fps);
    this.fpsEl.innerHTML = `FPS: ${Math.round(this.fps)}`, this.fpsCanvas.width - 100;
    let lastScore = document.getElementById("score").innerText;
    let score = 0;
    this.pipes.forEach((pipe) => {
      if (pipe.x < this.player.x) {
        score += 0.5;
      }
    });
    score = Math.max(0, score);
    document.getElementById("score").innerText = `${Math.round(score)}`;
    if (Math.round(score) > parseInt(lastScore)) {
      this.coinSound.play();
    }
    if (this.canvas == null)
      return;
    if (this.ctx === null) {
      throw new Error("Context not found");
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    let offset = (now - this.startTime) / 1000 * 100;
    this.ctx.drawImage(this.bg, 0 + offset, 0, 720, 1280, 0, 0, this.canvas.width, this.canvas.height);
    this.update(dt);
    this.player.render(this.ctx);
    this.pipes.forEach((pipe) => {
      pipe.render(this.ctx);
    });
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  GameOver() {
    this.gameOverSound.play();
    let fontSize = 32;
    fontSize = Math.min(fontSize, this.width / 10);
    this.ctx.fillStyle = "black";
    this.ctx.font = fontSize + "px 'Press Start 2P'";
    let fontWidth = this.ctx.measureText("Game Over").width;
    this.ctx.fillText("Game Over", this.width / 2 - fontWidth / 2, this.height / 2 - 100);
    let button = document.querySelector("#restartButton");
    button.style.display = "block";
    button.onclick = () => {
      this.startGame();
      button.style.display = "none";
    };
  }
}
var keys = [];
document.addEventListener("mousedown", (event) => {
  keys.push("Space");
});
document.addEventListener("mouseup", (event) => {
  keys = keys.filter((key) => key !== "Space");
});
document.addEventListener("touchstart", (event) => {
  keys.push("Space");
});
document.addEventListener("touchend", (event) => {
  keys = keys.filter((key) => key !== "Space");
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    keys.push("Space");
    event.preventDefault();
  }
});
document.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    keys = keys.filter((key) => key !== "Space");
  }
});
var game;
window.addEventListener("load", () => {
  game = new Coptero;
});
