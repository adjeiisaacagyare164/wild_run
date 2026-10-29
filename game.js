const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.getElementById("scoreValue");
const coinValue = document.getElementById("coinValue");
const xpFill = document.getElementById("xpFill");
const levelLabel = document.getElementById("levelLabel");
const introPanel = document.getElementById("introPanel");
const endPanel = document.getElementById("endPanel");
const pauseButton = document.getElementById("pauseButton");
const toast = document.getElementById("toast");

const game = {
    state: "ready",
    width: 0,
    height: 0,
    ground: 0,
    lastTime: 0,
    elapsed: 0,
    distance: 0,
    coins: 0,
    xp: 0,
    level: 1,
    speed: 300,
    sceneryOffset: 0,
    obstacleTimer: 1.8,
    appleTimer: 1.2,
    coinTimer: 2.3,
    toastTimer: 0,
    obstacles: [],
    apples: [],
    pickups: [],
    player: { x: 0, y: 0, velocityY: 0, sliding: false, slideTimer: 0 }
};

function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    game.ground = game.height - Math.max(82, game.height * 0.15);
    canvas.width = Math.round(game.width * ratio);
    canvas.height = Math.round(game.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    game.player.x = Math.min(170, game.width * 0.2);
    if (game.player.y === 0 || game.player.y > game.ground - 66) {
        game.player.y = game.ground - 66;
        game.player.velocityY = 0;
    }
    draw();
}

function roundedRect(x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, game.height);
    sky.addColorStop(0, "#9bd5c9");
    sky.addColorStop(0.55, "#dce9b9");
    sky.addColorStop(1, "#71984f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.fillStyle = "rgba(255, 246, 191, .58)";
    ctx.beginPath();
    ctx.arc(game.width * 0.78, game.height * 0.2, 42, 0, Math.PI * 2);
    ctx.fill();

    drawHill(game.height * 0.61, "#a9c987", 0.0007, 75);
    drawHill(game.height * 0.69, "#83ad6b", 0.0011, 48);
    drawTrees();

    ctx.fillStyle = "#6e8f4e";
    ctx.fillRect(0, game.ground, game.width, game.height - game.ground);
    ctx.fillStyle = "#8baa61";
    ctx.fillRect(0, game.ground, game.width, 7);
    ctx.fillStyle = "rgba(53, 87, 48, .23)";
    for (let x = -50 - (game.sceneryOffset % 70); x < game.width + 70; x += 70) {
        ctx.fillRect(x, game.ground + 26, 34, 3);
    }
}

function drawHill(base, color, frequency, amplitude) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, game.height);
    for (let x = 0; x <= game.width + 8; x += 8) {
        const y = base + Math.sin((x + game.sceneryOffset * 0.13) * frequency) * amplitude
            + Math.sin((x - game.sceneryOffset * 0.08) * frequency * 2.1) * amplitude * 0.35;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(game.width, game.height);
    ctx.closePath();
    ctx.fill();
}

function drawTrees() {
    const spacing = 115;
    const offset = (game.sceneryOffset * 0.22) % spacing;
    for (let i = -1; i < Math.ceil(game.width / spacing) + 1; i += 1) {
        const x = i * spacing - offset + 26;
        const top = game.height * 0.35 + (i % 3) * 13;
        ctx.fillStyle = "rgba(58, 103, 70, .7)";
        ctx.fillRect(x - 5, top + 44, 10, game.ground - top - 44);
        ctx.fillStyle = i % 2 ? "#79a876" : "#6f9d70";
        ctx.beginPath();
        ctx.arc(x, top + 34, 30, 0, Math.PI * 2);
        ctx.arc(x - 18, top + 48, 22, 0, Math.PI * 2);
        ctx.arc(x + 19, top + 49, 23, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSnake() {
    const player = game.player;
    const sliding = player.sliding;
    const bodyY = sliding ? game.ground - 30 : player.y + 25;
    const bodyHeight = sliding ? 22 : 29;
    const bodyX = player.x + 7;
    const bodyWidth = sliding ? 83 : 79;

    ctx.fillStyle = "rgba(38, 67, 45, .2)";
    ctx.beginPath();
    ctx.ellipse(player.x + 43, game.ground - 3, 49, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 3; i >= 0; i -= 1) {
        const x = bodyX + i * 18;
        const y = bodyY + Math.sin(game.elapsed * 9 + i * 0.8) * (sliding ? 0 : 4);
        ctx.fillStyle = ["#4c873f", "#579747", "#62a94d", "#73ba56"][i];
        ctx.beginPath();
        ctx.ellipse(x, y, sliding ? 14 : 16, bodyHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(220, 244, 133, .45)";
        ctx.beginPath();
        ctx.arc(x - 3, y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    const headX = bodyX + bodyWidth - 8;
    const headY = sliding ? game.ground - 34 : player.y + 22;
    ctx.fillStyle = "#83c75c";
    ctx.beginPath();
    ctx.ellipse(headX, headY, 22, sliding ? 15 : 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8df";
    ctx.beginPath();
    ctx.arc(headX + 8, headY - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#243d32";
    ctx.beginPath();
    ctx.arc(headX + 10, headY - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#426e3d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX + 15, headY + 6);
    ctx.quadraticCurveTo(headX + 22, headY + 10, headX + 27, headY + 6);
    ctx.stroke();
}

function drawAdam() {
    const x = Math.max(10, game.player.x - 83);
    const y = game.ground - 47 + Math.sin(game.elapsed * 13) * 2;
    ctx.fillStyle = "rgba(38, 67, 45, .18)";
    ctx.beginPath();
    ctx.ellipse(x + 24, game.ground - 3, 24, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#755b49";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 30);
    ctx.lineTo(x + 11 + Math.sin(game.elapsed * 12) * 4, game.ground - 3);
    ctx.moveTo(x + 31, y + 30);
    ctx.lineTo(x + 35 - Math.sin(game.elapsed * 12) * 4, game.ground - 3);
    ctx.stroke();
    ctx.fillStyle = "#dc9a66";
    ctx.beginPath();
    ctx.arc(x + 24, y + 8, 11, 0, Math.PI * 2);
    ctx.fill();
    roundedRect(x + 12, y + 19, 24, 26, 8, "#df6c48");
    ctx.fillStyle = "#493f35";
    ctx.beginPath();
    ctx.arc(x + 21, y + 7, 10, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#44392e";
    ctx.beginPath();
    ctx.arc(x + 28, y + 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawObstacle(obstacle) {
    if (obstacle.type === "log") {
        roundedRect(obstacle.x, game.ground - obstacle.height, obstacle.width, obstacle.height, 9, "#79563d");
        roundedRect(obstacle.x + 5, game.ground - obstacle.height + 5, obstacle.width - 10, 7, 4, "#a77a4e");
        ctx.fillStyle = "#d0a36d";
        ctx.beginPath();
        ctx.ellipse(obstacle.x + obstacle.width - 5, game.ground - obstacle.height / 2, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#99734c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(obstacle.x + obstacle.width - 5, game.ground - obstacle.height / 2, 4, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        ctx.fillStyle = "#6c8045";
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y);
        ctx.quadraticCurveTo(obstacle.x + obstacle.width / 2, obstacle.y + 13, obstacle.x + obstacle.width, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#a9bb60";
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 8, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + 19, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + 19, obstacle.y + obstacle.height + 9);
        ctx.lineTo(obstacle.x + 8, obstacle.y + obstacle.height + 5);
        ctx.fill();
    }
}

function drawApple(apple) {
    ctx.fillStyle = "#e45d4d";
    ctx.beginPath();
    ctx.arc(apple.x, apple.y, 12, 0, Math.PI * 2);
    ctx.arc(apple.x + 10, apple.y + 1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#735338";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(apple.x + 4, apple.y - 10);
    ctx.lineTo(apple.x + 6, apple.y - 16);
    ctx.stroke();
    ctx.fillStyle = "#78a95a";
    ctx.beginPath();
    ctx.ellipse(apple.x + 11, apple.y - 13, 6, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawCoin(coin) {
    ctx.fillStyle = "#b77e29";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd76a";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y - 1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e3a83c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y - 1, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#c98c2f";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦", coin.x, coin.y + 3);
}

function draw() {
    if (!game.width || !game.height) return;
    drawBackground();
    game.obstacles.forEach(drawObstacle);
    game.apples.forEach(drawApple);
    game.pickups.forEach(drawCoin);
    drawAdam();
    drawSnake();
    if (game.state === "paused") {
        ctx.fillStyle = "rgba(24, 52, 43, .22)";
        ctx.fillRect(0, 0, game.width, game.height);
        ctx.fillStyle = "#fff8e9";
        ctx.font = "700 30px 'Trebuchet MS', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", game.width / 2, game.height / 2);
    }
}

function addExperience(amount) {
    game.xp += amount;
    if (game.xp >= 100) {
        game.xp -= 100;
        game.level += 1;
        game.speed += 22;
        levelLabel.textContent = `LVL ${game.level}`;
        showToast(`LEVEL UP!  Speed +`);
    }
    xpFill.style.width = `${game.xp}%`;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    game.toastTimer = 1.2;
}

function startGame() {
    game.state = "running";
    game.elapsed = 0;
    game.distance = 0;
    game.coins = 0;
    game.xp = 0;
    game.level = 1;
    game.speed = 300;
    game.sceneryOffset = 0;
    game.obstacleTimer = 1.6;
    game.appleTimer = 1.1;
    game.coinTimer = 2.1;
    game.obstacles = [];
    game.apples = [];
    game.pickups = [];
    game.player.y = game.ground - 66;
    game.player.velocityY = 0;
    game.player.sliding = false;
    scoreValue.textContent = "0";
    coinValue.textContent = "0";
    xpFill.style.width = "0%";
    levelLabel.textContent = "LVL 1";
    introPanel.hidden = true;
    endPanel.hidden = true;
    pauseButton.hidden = false;
    pauseButton.textContent = "Ⅱ";
    pauseButton.setAttribute("aria-label", "Pause game");
    game.lastTime = performance.now();
}

function endGame() {
    game.state = "over";
    document.getElementById("finalScore").textContent = Math.floor(game.distance).toLocaleString();
    document.getElementById("finalCoins").textContent = game.coins;
    document.getElementById("endMessage").textContent = game.distance > 500
        ? "That was a mighty fine run. Fancy another?"
        : "Adam caught up this time. Ready for another run?";
    endPanel.hidden = false;
    pauseButton.hidden = true;
}

function jump() {
    if (game.state === "ready" || game.state === "over") {
        startGame();
        return;
    }
    if (game.state !== "running" || game.player.y < game.ground - 66) return;
    game.player.sliding = false;
    game.player.velocityY = -610;
}

function slide() {
    if (game.state !== "running") return;
    game.player.sliding = true;
    game.player.slideTimer = 0.62;
}

function update(delta) {
    game.elapsed += delta;
    game.distance += delta * (game.speed / 10);
    game.sceneryOffset += game.speed * delta;
    scoreValue.textContent = Math.floor(game.distance).toLocaleString();

    const player = game.player;
    if (player.y < game.ground - 66 || player.velocityY < 0) {
        player.velocityY += 1550 * delta;
        player.y += player.velocityY * delta;
        if (player.y >= game.ground - 66) {
            player.y = game.ground - 66;
            player.velocityY = 0;
        }
    }
    if (player.slideTimer > 0) {
        player.slideTimer -= delta;
        if (player.slideTimer <= 0) player.sliding = false;
    }

    game.obstacleTimer -= delta;
    if (game.obstacleTimer <= 0) {
        const log = Math.random() < 0.58;
        game.obstacles.push(log
            ? { type: "log", x: game.width + 30, width: 47, height: 43 }
            : { type: "branch", x: game.width + 30, width: 92, height: 24, y: game.ground - 112 });
        game.obstacleTimer = Math.max(1.05, 1.9 - game.elapsed / 100) + Math.random() * 0.75;
    }
    game.appleTimer -= delta;
    if (game.appleTimer <= 0) {
        game.apples.push({ x: game.width + 20, y: game.ground - 31 - Math.random() * 80 });
        game.appleTimer = 1.2 + Math.random() * 1.3;
    }
    game.coinTimer -= delta;
    if (game.coinTimer <= 0) {
        game.pickups.push({ x: game.width + 20, y: game.ground - 38 - Math.random() * 75 });
        game.coinTimer = 2 + Math.random() * 1.8;
    }

    const movement = game.speed * delta;
    game.obstacles = game.obstacles.filter(obstacle => obstacle.x + obstacle.width > -10);
    game.apples = game.apples.filter(apple => apple.x > -20);
    game.pickups = game.pickups.filter(coin => coin.x > -20);
    game.obstacles.forEach(obstacle => { obstacle.x -= movement; });
    game.apples.forEach(apple => { apple.x -= movement; });
    game.pickups.forEach(coin => { coin.x -= movement; });

    const playerLeft = player.x + 14;
    const playerRight = player.x + 78;
    const playerTop = player.sliding ? game.ground - 35 : player.y + 14;
    const playerBottom = player.sliding ? game.ground - 3 : player.y + 61;
    for (const obstacle of game.obstacles) {
        const obstacleLeft = obstacle.x + 5;
        const obstacleRight = obstacle.x + obstacle.width - 5;
        const obstacleTop = obstacle.type === "log" ? game.ground - obstacle.height + 5 : obstacle.y + 13;
        const obstacleBottom = obstacle.type === "log" ? game.ground : obstacle.y + obstacle.height;
        if (playerRight > obstacleLeft && playerLeft < obstacleRight
            && playerBottom > obstacleTop && playerTop < obstacleBottom) {
            endGame();
            return;
        }
    }

    game.apples = game.apples.filter(apple => {
        const hit = Math.abs(apple.x + 5 - (player.x + 74)) < 36
            && Math.abs(apple.y - (player.y + (player.sliding ? 31 : 35))) < 42;
        if (hit) {
            addExperience(25);
            showToast("YUM!  +25 XP");
        }
        return !hit;
    });
    game.pickups = game.pickups.filter(coin => {
        const hit = Math.abs(coin.x - (player.x + 72)) < 34
            && Math.abs(coin.y - (player.y + 34)) < 40;
        if (hit) {
            game.coins += 1;
            coinValue.textContent = game.coins;
            showToast("NICE FIND!  +1 COIN");
        }
        return !hit;
    });

    if (game.toastTimer > 0) {
        game.toastTimer -= delta;
        if (game.toastTimer <= 0) toast.classList.remove("visible");
    }
}

function frame(timestamp) {
    const delta = Math.min((timestamp - (game.lastTime || timestamp)) / 1000, 0.04);
    game.lastTime = timestamp;
    if (game.state === "running") update(delta);
    else if (game.state === "ready" || game.state === "over") game.elapsed += delta;
    draw();
    requestAnimationFrame(frame);
}

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("restartButton").addEventListener("click", startGame);
document.getElementById("jumpButton").addEventListener("pointerdown", jump);
document.getElementById("slideButton").addEventListener("pointerdown", slide);
pauseButton.addEventListener("click", () => {
    if (game.state === "running") {
        game.state = "paused";
        pauseButton.textContent = "▶";
        pauseButton.setAttribute("aria-label", "Resume game");
    } else if (game.state === "paused") {
        game.state = "running";
        game.lastTime = performance.now();
        pauseButton.textContent = "Ⅱ";
        pauseButton.setAttribute("aria-label", "Pause game");
    }
});
document.addEventListener("keydown", event => {
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        jump();
    } else if (event.code === "ArrowDown" || event.code === "ShiftLeft" || event.code === "KeyS") {
        event.preventDefault();
        slide();
    } else if (event.code === "Escape" && game.state === "running") {
        pauseButton.click();
    } else if ((event.code === "Escape" || event.code === "Enter") && game.state === "paused") {
        pauseButton.click();
    }
});
window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
