// src/assets/js/main.ts
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
    let downPipe = new Pipe(xCord, height - barHeight, barWidth, barHeight - offset);
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
  document.getElementById("fps").innerText = `FPS: ${Math.round(fps)}`;
  let score = (now - startTime) / 1000;
  document.getElementById("score").innerText = `Score: ${Math.round(score)}`;
  let ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Context not found");
  }
  ctx.clearRect(0, 0, width, height);
  update(fps);
  if (gameOver) {
    let ok = confirm("Game Over");
    if (ok) {
      startGame();
    }
    return;
  }
  player.render(ctx);
  pipes.forEach((pipe) => {
    pipe.render(ctx);
  });
  requestAnimationFrame(gameLoop);
};
var canvas = document.getElementById("myCanvas");
if (canvas === null) {
  throw new Error("Canvas not found");
}
canvas.width = (window.innerHeight - 100) / 16 * 9;
canvas.height = window.innerHeight - 100;
var width = canvas.width;
var height = canvas.height;
var frameRate = 60;

class Player {
  x;
  y;
  radius;
  dy = 0;
  ddy = 0.2;
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }
  update(frames) {
    if (keys.includes("Space")) {
      this.jump();
    }
    this.dy = this.dy + this.ddy * frames / frameRate;
    this.y = this.y + this.dy;
  }
  render(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  }
  jump() {
    this.dy = -this.ddy * 15;
  }
}

class Pipe {
  x;
  y;
  width2;
  height2;
  constructor(x, y, width2, height2) {
    this.x = x;
    this.y = y;
    this.width = width2;
    this.height = height2;
  }
  update(frames) {
    this.x -= 2 * frames / frameRate;
  }
  render(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
var player;
var pipes = [];
var fps = 0;
var lastFrameTime = 0;
var startTime = performance.now();
var gameOver = false;
startGame();
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
