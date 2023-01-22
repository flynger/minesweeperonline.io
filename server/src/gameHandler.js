module.exports = (server) => {
    var gameHandler = {
        Board: class {
            // creates a board
            constructor({ startX, startY, width, height, mines }, players) {
                console.log("Board created!");
                this.SETTINGS = { width, height, mines };
                this.WIDTH = width, this.HEIGHT = height;
                this.GRID = new Array(height).fill("").map(x => new Array(width).fill("0"));
                this.CLEARED = new Array(height).fill("").map(x => new Array(width).fill("?"));
                this.MINES = mines;
                this.CLEAREDCELLS = this.TIME = 0;
                this.TOTALCELLS = width * height - mines;
                this.GAMEOVER = this.WIN = false;
                this.CLEARQUEUE = [];
                this.TIMESTAMPS = [];
                this.PLAYERS = players;
                this.SPECTATORS = [];
                for (let p of this.PLAYERS) {
                    let player = server.players[p];
                    if (player.spectatorSockets) {
                        for (let spectatorSocket of player.spectatorSockets) {
                            spectatorSocket.spectateBoard = this;
                        }
                        this.SPECTATORS.push(...player.spectatorSockets);
                    }
                }

                for (let v = -1; v <= 1; v++) {
                    for (let h = -1; h <= 1; h++) {
                        if (this.GRID[startY + v] && this.GRID[startY + v][startX + h] && (this.TOTALCELLS >= 9 || (h == 0 && v == 0))) this.GRID[startY + v][startX + h] = "SAFE";
                    }
                }

                while (this.MINES > 0) {
                    let x = this.randomNumber(0, width - 1);
                    let y = this.randomNumber(0, height - 1);
                    if (this.GRID[y][x] !== "X" && this.GRID[y][x] !== "SAFE") {
                        this.GRID[y][x] = "X";
                        this.MINES--;
                    }
                }
                this.MINES = mines; // reset variable back to mine count

                for (let row in this.GRID) {
                    for (let col in this.GRID[row]) {
                        if (this.GRID[row][col] !== "X") {
                            this.GRID[row][col] = this.countMines(+col, +row);
                        }
                    }
                }
                this.clearCell(startX, startY);
            }
            // count mines while generating
            countMines(x, y) {
                let mines = 0;
                for (let v = -1; v <= 1; v++) {
                    for (let h = -1; h <= 1; h++) {
                        if (this.GRID[y + v] && this.GRID[y + v][x + h] != undefined && this.GRID[y + v][x + h] === "X") mines++;
                    }
                }
                return mines;
            }
            // clears a cell
            clearCell(x, y) {
                // if (this.CLEARED[y][x] === "?" || this.CLEARED[y][x] === "Q") {
                if (this.GRID[y][x] === "X") {
                    for (let row in this.GRID) {
                        for (let col in this.GRID[row]) {
                            let isFlagged = this.CLEARED[row][col] === "F";
                            if (this.GRID[row][col] === "X") {
                                if (!isFlagged && this.CLEARED[row][col] != "RX") {
                                    this.CLEARED[row][col] = "X";
                                }
                            }
                            else if (isFlagged) {
                                this.CLEARED[row][col] = "FX";
                            }
                        }
                    }
                    this.CLEARED[y][x] = "RX";
                    this.GAMEOVER = true; // game over
                } else {
                    this.CLEARED[y][x] = this.GRID[y][x];
                    this.CLEAREDCELLS++;
                    if (this.GRID[y][x] === 0) {
                        for (let v = -1; v <= 1; v++) {
                            for (let h = -1; h <= 1; h++) {
                                if (!(v === 0 && h === 0) && this.GRID[y + v] && this.GRID[y + v][x + h] !== undefined && (this.CLEARED[y + v][x + h] === "?" || this.CLEARED[y + v][x + h] === "F")) {
                                    this.CLEARQUEUE.push([x + h, y + v]);
                                    this.CLEARED[y + v][x + h] = "Q";
                                }
                            }
                        }
                    }
                    if (this.CLEAREDCELLS === this.TOTALCELLS) {
                        for (let row in this.GRID) {
                            for (let col in this.GRID[row]) {
                                if (this.GRID[row][col] === "X") {
                                    this.CLEARED[row][col] = "F";
                                }
                            }
                        }
                        this.GAMEOVER = true;
                        this.WIN = true;
                    }
                }
            }
            // flags a cell
            flagCell(x, y) {
                if (this.checkCell(x, y, ["?"])) {
                    this.CLEARED[y][x] = "F";
                    return true;
                }
                return false;
            }
            unflagCell(x, y) {
                if (this.checkCell(x, y, ["F"])) {
                    this.CLEARED[y][x] = "?";
                    return true;
                }
                return false;
            }
            // check if a cell satisfies its flag count for chording
            satisfyFlags(x, y) {
                let flags = 0;
                for (let v = -1; v <= 1; v++) {
                    for (let h = -1; h <= 1; h++) {
                        if (this.GRID[y + v] && this.GRID[y + v][x + h] !== undefined && this.CLEARED[y + v][x + h] === "F") {
                            flags++;
                        }
                    }
                }
                return this.GRID[y][x] == flags;
            }
            // check the 'visible' value of a cell
            checkCell(x, y, options) {
                return this.GRID[y] && this.GRID[y][x] != undefined && options && options.includes(this.CLEARED[y][x]);
            }
            // random number between min and max inclusive
            randomNumber(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
            clearQueue() {
                while (this.CLEARQUEUE.length > 0) {
                    let cell = this.CLEARQUEUE.pop();
                    this.clearCell(cell[0], cell[1]);
                }
            }
            startTimer() {
                this.timer = setInterval(() => {
                    this.TIME++;
                    // console.log("counting time: ", this.TIME);
                    for (let i of this.PLAYERS) {
                        let player = server.players[i];
                        if (player && player.connected) {
                            player.socket.emit("boardTime", { time: this.TIME });
                        }
                    }
                    for (let spectatorSocket of this.SPECTATORS) {
                        spectatorSocket.emit("boardTime", { time: this.TIME });
                    }
                }, 1000);
                this.START_TIME = Date.now();
            }
            stopTimer() {
                this.GAMEDURATION = (Date.now() - this.START_TIME) / 1000; // store game duration in seconds
                console.log("Game lasted " + this.GAMEDURATION + "s");
                if (this.timer) clearInterval(this.timer);
            }
            reset(sendStats) {
                // stops timer and deletes reference to board, letting it be deleted by garbage collector
                this.stopTimer();
                let playersList = this.PLAYERS.map(name => server.players.hasOwnProperty(name) ? server.players[name].displayName : "A Guest");
                let spectatorsList = this.SPECTATORS.map(socket => server.players[socket.username].displayName);
                let result = this.WIN ? "Win" : "Loss";
                for (let i of this.PLAYERS) {
                    if (server.players.hasOwnProperty(i)) {
                        let player = server.players[i];
                        if (sendStats && player.connected) {
                            player.socket.emit("gameStats", { time: this.GAMEDURATION, result: result, players: playersList, spectators: spectatorsList });
                        }
                        delete player.board;
                    }
                }
                for (let spectatorSocket of this.SPECTATORS) {
                    if (sendStats) {
                        spectatorSocket.emit("gameStats", { time: this.GAMEDURATION, result: result, players: playersList, spectators: spectatorsList });
                    }
                    delete spectatorSocket.spectateBoard;
                }
            }
        },
        Game: class {
            constructor(numOfBoards, settings, teams, mode) {
                this.boards = [];
                this.mode = mode;
                this.settings = settings;
                this.teams = teams;
                this.spectators = [];
                for (let i = 0; i < numOfBoards; i++) {
                    this.boards.push(new Board(settings, teams[i]));
                }
            }
        }
    }

    return server.gameHandler = gameHandler;
}