// src/assets/js/main.ts
var drawImage = function(ctx, img, x, y, angle = 0, scale = 1) {
  let scale_half = scale / 2;
  x -= img.width * scale_half;
  y -= img.height * scale_half;
  ctx.save();
  ctx.translate(x + img.width * scale_half, y + img.height * scale_half);
  ctx.rotate(angle);
  ctx.translate(-x - img.width * scale_half, -y - img.height * scale_half);
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  ctx.restore();
};
var startGame = function() {
  startTime = performance.now();
  player = new Player(width / 3, height / 2, 25);
  pipes = [];
  for (var i = 0;i < 100; i++) {
    let xCord = width + i * 100;
    let gapBetweenBars = 300 - i * 5;
    let barHeight = height / 2 - gapBetweenBars / 2;
    let offset = Math.random() * 100 - 50;
    let barWidth = 35;
    let pipe = new Pipe(xCord, 0, barWidth, barHeight + offset);
    let downPipe = new Pipe(xCord, height - barHeight + offset, barWidth, barHeight - offset);
    pipes.push(pipe);
    pipes.push(downPipe);
  }
  gameOver = false;
  requestAnimationFrame(gameLoop);
};
var collding = function(player, pipe) {
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
};
var update = function(frames) {
  player.update(frames);
  if (player.y > height) {
    gameOver = true;
    return;
  }
  pipes.forEach((pipe) => {
    pipe.update(frames);
    if (collding(player, pipe)) {
      gameOver = true;
      return;
    }
  });
};
var gameLoop = function() {
  let now = performance.now();
  let dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  fps = 1 / dt;
  if (fpsCtx === null) {
    throw new Error("Context not found");
  }
  let data = fpsCtx.getImageData(0, 0, fpsCanvas.width, fpsCanvas.height);
  fpsCtx.clearRect(0, 0, fpsCanvas.width, fpsCanvas.height);
  fpsCtx.putImageData(data, -1, 0);
  fpsCtx.fillStyle = "black";
  fpsCtx.fillRect(fpsCanvas.width - 1, 0, 1, fps);
  let score = (now - startTime) / 1000;
  document.getElementById("score").innerText = `Score: ${Math.round(score)}`;
  if (canvas == null)
    return;
  if (ctx === null) {
    throw new Error("Context not found");
  }
  ctx.clearRect(0, 0, width, height);
  let offset = (now - startTime) / 1000 * 100;
  ctx.drawImage(bg, 0 + offset, 0, 720, 1280, 0, 0, canvas.width, canvas.height);
  update(fps);
  if (gameOver) {
    return;
  }
  player.render(ctx);
  pipes.forEach((pipe) => {
    pipe.render(ctx);
  });
  requestAnimationFrame(gameLoop);
};

class Particle {
  x;
  y;
  dx;
  dy;
  radius;
  age = 100;
  constructor(x, y, dx, dy, radius) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
  }
  update(frames) {
    this.x += this.dx * frames / frameRate;
    this.y += this.dy * frames / frameRate;
    this.age -= 1;
  }
  render(ctx) {
    ctx.fillStyle = `hsl(100 100% 50% / ${this.age}%)`;
    ctx.beginPath();
    ctx.arc(this.x - 10, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class Player {
  x;
  y;
  radius;
  dy = 0;
  ddy = 0.2;
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
  update(frames) {
    if (keys.includes("Space")) {
      this.jump();
    }
    this.dy = this.dy + this.ddy * frames / frameRate;
    this.y = this.y + this.dy;
    this.rotation += 1;
    this.particles.forEach((particle) => {
      particle.update(frames);
    });
    for (let i = 0;i < this.particles.length; i++) {
      let particle = this.particles[i];
      if (particle.age <= 0) {
        this.particles.splice(i, 1);
      }
    }
    console.log(this.particles.length);
  }
  render(ctx) {
    drawImage(ctx, playerImg, this.x, this.y, this.rotation * Math.PI / 180, 2);
    this.particles.forEach((particle) => {
      particle.render(ctx);
    });
  }
  jump() {
    this.rotation = -30;
    this.dy = -this.ddy * 15;
    for (let i = 0;i < 50; i++) {
      let dx = Math.random() - 2;
      let dy = Math.random() * 2 - 1;
      let particle = new Particle(this.x, this.y, dx, dy, 2);
      this.particles.push(particle);
    }
  }
}

class Pipe {
  x;
  y;
  width;
  height;
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  update(frames) {
    this.x -= 2 * frames / frameRate;
  }
  render(ctx) {
    for (let i = 0;i < this.height; i += 32) {
      ctx.drawImage(wall, 0, 0, 32, 32, this.x, this.y + i, this.width, 32);
    }
  }
}
var keys = [];
document.addEventListener("mousedown", (event) => {
  keys.push("Space");
});
document.addEventListener("mouseup", (event) => {
  keys = keys.filter((key) => key !== "Space");
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    keys.push("Space");
  }
});
document.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    keys = keys.filter((key) => key !== "Space");
  }
});
var canvas = document.getElementById("myCanvas");
if (canvas === null) {
  throw new Error("Canvas not found");
}
canvas.width = (window.innerHeight - 100) / 16 * 9;
canvas.height = window.innerHeight - 100;
var dpr = window.devicePixelRatio;
var rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
var fpsCanvas = document.querySelector("#fps");
var fpsCtx = fpsCanvas.getContext("2d");
var ctx = canvas.getContext("2d", { alpha: false });
ctx.scale(dpr, dpr);
canvas.style.width = `${rect.width}px`;
canvas.style.height = `${rect.height}px`;
var width = canvas.width;
var height = canvas.height;
var frameRate = 60;
var playerImg = new Image;
playerImg.src = "/img/player.png";
var bg = new Image;
bg.src = "/img/machu-picchu.png";
var wall = new Image;
wall.src = "/img/wall.png";
var player;
var pipes = [];
var fps = 0;
var lastFrameTime = 0;
var startTime = performance.now();
var gameOver = false;
startGame();
