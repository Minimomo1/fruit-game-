class FruitGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.level = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.gridSize = 8;
        this.cellSize = this.canvas.width / this.gridSize;
        this.fruits = [];
        this.selectedFruit = null;
        this.particles = [];
        
        // 水果类型和颜色
        this.fruitTypes = [
            { name: '🍎', color: '#ff6b6b', points: 10 },
            { name: '🍊', color: '#ffa726', points: 15 },
            { name: '🍌', color: '#ffeb3b', points: 20 },
            { name: '🍇', color: '#9c27b0', points: 25 },
            { name: '🍓', color: '#f44336', points: 30 },
            { name: '🍑', color: '#ffcdd2', points: 35 },
            { name: '🥝', color: '#8bc34a', points: 40 },
            { name: '🍍', color: '#ff9800', points: 45 }
        ];
        
        this.init();
    }
    
    init() {
        this.generateFruits();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.animate();
    }
    
    generateFruits() {
        this.fruits = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.fruits[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.fruits[row][col] = this.createRandomFruit(row, col);
            }
        }
        // 确保初始状态没有匹配
        this.removeInitialMatches();
    }
    
    createRandomFruit(row, col) {
        const type = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        return {
            type: type,
            row: row,
            col: col,
            x: col * this.cellSize,
            y: row * this.cellSize,
            targetX: col * this.cellSize,
            targetY: row * this.cellSize,
            scale: 1,
            rotation: 0,
            isAnimating: false
        };
    }
    
    removeInitialMatches() {
        let hasMatches = true;
        while (hasMatches) {
            hasMatches = false;
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.checkMatches(row, col).length > 0) {
                        this.fruits[row][col] = this.createRandomFruit(row, col);
                        hasMatches = true;
                    }
                }
            }
        }
    }
    
    handleClick(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            if (!this.selectedFruit) {
                this.selectedFruit = { row, col };
                this.fruits[row][col].scale = 1.2;
            } else {
                if (this.isAdjacent(this.selectedFruit, { row, col })) {
                    this.swapFruits(this.selectedFruit, { row, col });
                }
                this.fruits[this.selectedFruit.row][this.selectedFruit.col].scale = 1;
                this.selectedFruit = null;
            }
        }
    }
    
    handleMouseMove(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // 重置所有水果的悬停效果
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!this.selectedFruit || (this.selectedFruit.row !== r || this.selectedFruit.col !== c)) {
                    this.fruits[r][c].scale = 1;
                }
            }
        }
        
        // 添加悬停效果
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            if (!this.selectedFruit || (this.selectedFruit.row !== row || this.selectedFruit.col !== col)) {
                this.fruits[row][col].scale = 1.1;
            }
        }
    }
    
    isAdjacent(pos1, pos2) {
        return (Math.abs(pos1.row - pos2.row) === 1 && pos1.col === pos2.col) ||
               (Math.abs(pos1.col - pos2.col) === 1 && pos1.row === pos2.row);
    }
    
    swapFruits(pos1, pos2) {
        const fruit1 = this.fruits[pos1.row][pos1.col];
        const fruit2 = this.fruits[pos2.row][pos2.col];
        
        // 交换位置
        [fruit1.row, fruit1.col, fruit2.row, fruit2.col] = [fruit2.row, fruit2.col, fruit1.row, fruit1.col];
        [fruit1.targetX, fruit1.targetY, fruit2.targetX, fruit2.targetY] = 
        [fruit2.targetX, fruit2.targetY, fruit1.targetX, fruit1.targetY];
        
        // 交换数组中的位置
        [this.fruits[pos1.row][pos1.col], this.fruits[pos2.row][pos2.col]] = 
        [this.fruits[pos2.row][pos2.col], this.fruits[pos1.row][pos1.col]];
        
        // 检查是否有匹配
        setTimeout(() => {
            const matches1 = this.checkMatches(pos1.row, pos1.col);
            const matches2 = this.checkMatches(pos2.row, pos2.col);
            
            if (matches1.length > 0 || matches2.length > 0) {
                this.processMatches([...matches1, ...matches2]);
            } else {
                // 如果没有匹配，交换回来
                this.swapFruits(pos2, pos1);
            }
        }, 300);
    }
    
    checkMatches(row, col) {
        const fruit = this.fruits[row][col];
        const matches = new Set();
        
        // 检查水平匹配
        let horizontalMatches = [fruit];
        let left = col - 1;
        while (left >= 0 && this.fruits[row][left].type.name === fruit.type.name) {
            horizontalMatches.unshift(this.fruits[row][left]);
            left--;
        }
        let right = col + 1;
        while (right < this.gridSize && this.fruits[row][right].type.name === fruit.type.name) {
            horizontalMatches.push(this.fruits[row][right]);
            right++;
        }
        
        if (horizontalMatches.length >= 3) {
            horizontalMatches.forEach(f => matches.add(f));
        }
        
        // 检查垂直匹配
        let verticalMatches = [fruit];
        let up = row - 1;
        while (up >= 0 && this.fruits[up][col].type.name === fruit.type.name) {
            verticalMatches.unshift(this.fruits[up][col]);
            up--;
        }
        let down = row + 1;
        while (down < this.gridSize && this.fruits[down][col].type.name === fruit.type.name) {
            verticalMatches.push(this.fruits[down][col]);
            down++;
        }
        
        if (verticalMatches.length >= 3) {
            verticalMatches.forEach(f => matches.add(f));
        }
        
        return Array.from(matches);
    }
    
    processMatches(matches) {
        if (matches.length === 0) return;
        
        // 计算分数
        const points = matches.reduce((sum, fruit) => sum + fruit.type.points, 0) * matches.length;
        this.score += points;
        this.updateScore();
        
        // 创建粒子效果
        matches.forEach(fruit => {
            this.createParticles(fruit.x + this.cellSize/2, fruit.y + this.cellSize/2, fruit.type.color);
        });
        
        // 移除匹配的水果
        matches.forEach(fruit => {
            this.fruits[fruit.row][fruit.col] = null;
        });
        
        // 下落动画
        setTimeout(() => {
            this.dropFruits();
        }, 500);
    }
    
    dropFruits() {
        // 下落逻辑
        for (let col = 0; col < this.gridSize; col++) {
            let emptyRow = this.gridSize - 1;
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.fruits[row][col] !== null) {
                    if (row !== emptyRow) {
                        this.fruits[emptyRow][col] = this.fruits[row][col];
                        this.fruits[emptyRow][col].row = emptyRow;
                        this.fruits[emptyRow][col].targetY = emptyRow * this.cellSize;
                        this.fruits[row][col] = null;
                    }
                    emptyRow--;
                }
            }
            
            // 填充新水果
            for (let row = emptyRow; row >= 0; row--) {
                this.fruits[row][col] = this.createRandomFruit(row, col);
            }
        }
        
        // 检查新的匹配
        setTimeout(() => {
            let hasMatches = false;
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const matches = this.checkMatches(row, col);
                    if (matches.length > 0) {
                        this.processMatches(matches);
                        hasMatches = true;
                        break;
                    }
                }
                if (hasMatches) break;
            }
        }, 300);
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: color,
                size: Math.random() * 5 + 2
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.vy += 0.2; // 重力
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景
        this.drawGrid();
        
        // 绘制水果
        this.drawFruits();
        
        // 更新和绘制粒子
        this.updateParticles();
        this.drawParticles();
        
        // 动画水果位置
        this.animateFruits();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    drawFruits() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const fruit = this.fruits[row][col];
                if (fruit) {
                    this.ctx.save();
                    this.ctx.translate(fruit.x + this.cellSize/2, fruit.y + this.cellSize/2);
                    this.ctx.scale(fruit.scale, fruit.scale);
                    this.ctx.rotate(fruit.rotation);
                    
                    // 绘制水果阴影
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.fillRect(-this.cellSize/2 + 2, -this.cellSize/2 + 2, this.cellSize - 4, this.cellSize - 4);
                    
                    // 绘制水果背景
                    this.ctx.fillStyle = fruit.type.color;
                    this.ctx.fillRect(-this.cellSize/2, -this.cellSize/2, this.cellSize - 4, this.cellSize - 4);
                    
                    // 绘制水果图标
                    this.ctx.font = `${this.cellSize * 0.6}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(fruit.type.name, 0, 0);
                    
                    this.ctx.restore();
                }
            }
        }
    }
    
    animateFruits() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const fruit = this.fruits[row][col];
                if (fruit) {
                    // 平滑动画到目标位置
                    fruit.x += (fruit.targetX - fruit.x) * 0.1;
                    fruit.y += (fruit.targetY - fruit.y) * 0.1;
                    fruit.scale += (1 - fruit.scale) * 0.1;
                    fruit.rotation += (0 - fruit.rotation) * 0.1;
                }
            }
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        this.level = Math.floor(this.score / 1000) + 1;
        document.getElementById('level').textContent = this.level;
    }
    
    start() {
        this.isPlaying = true;
        this.isPaused = false;
    }
    
    pause() {
        this.isPaused = !this.isPaused;
    }
    
    reset() {
        this.score = 0;
        this.level = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.selectedFruit = null;
        this.particles = [];
        this.updateScore();
        this.generateFruits();
        document.getElementById('gameOver').style.display = 'none';
    }
}

// 全局游戏实例
let game;

// 初始化游戏
window.addEventListener('load', () => {
    game = new FruitGame();
});

// 游戏控制函数
function startGame() {
    if (game) {
        game.start();
    }
}

function pauseGame() {
    if (game) {
        game.pause();
    }
}

function resetGame() {
    if (game) {
        game.reset();
    }
} 