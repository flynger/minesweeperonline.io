module.exports = (server) => {
    var gameHandler = {
        Board: class {
            // creates a board
            constructor({ startX, startY, width, height, mines }, sessions, username) {
                console.log("Board created!");
                this.GRID = new Array(height).fill("").map(x => new Array(width).fill("0"));
                this.CLEARED = new Array(height).fill("").map(x => new Array(width).fill("?"));
                this.MINES = this.FLAGS = mines;
                this.CLEAREDCELLS = this.TIME = 0;
                this.GAMEOVER = this.WIN = false;
                this.TOTALCELLS = width * height - mines;
                this.CLEARQUEUE = [];
                this.connectedPlayers = [];
                // remove when ^ is functional
                this.connectedSessions = sessions;

                //console.log(server.players[username]);
                if (server.players.hasOwnProperty(username)) {
                    server.players[username].currentGame = this.CLEARED;
                    server.players[username].currentGameOver = this.GAMEOVER;
                    server.players[username].currentWin = this.WIN;
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
                this.clearCell(startX, startY, username);
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
            clearCell(x, y, username) {
                // if (this.CLEARED[y][x] === "?" || this.CLEARED[y][x] === "Q") {
                if (this.GRID[y][x] === "X") {
                    for (let row in this.GRID) {
                        for (let col in this.GRID[row]) {
                            let isFlagged = this.GRID[row][col] === "F";
                            if (this.GRID[row][col] === "X") {
                                if (!isFlagged && this.CLEARED[row][col] != "RX") {
                                    this.CLEARED[row][col] = "X";
                                    if (server.players.hasOwnProperty(username)) {
                                        server.players[username].currentGame[row][col] = "X";
                                    }
                                }
                            }
                            else if (isFlagged) {
                                this.CLEARED[row][col] = "FX";
                                if (server.players.hasOwnProperty(username)) {
                                    server.players[username].currentGame[row][col] = "FX";
                                }
                            }
                        }
                    }
                    this.CLEARED[y][x] = "RX";
                    if (server.players.hasOwnProperty(username)) {
                        server.players[username].currentGame[y][x] = "RX";
                    }
                    this.GAMEOVER = true; // game over
                    if (server.players.hasOwnProperty(username)) {
                        server.players[username].currentGameOver = true;
                    }
                } else {
                    this.CLEARED[y][x] = this.GRID[y][x];
                    if (server.players.hasOwnProperty(username)) {
                        server.players[username].currentGame[y][x] = this.GRID[y][x];
                    }
                    this.CLEAREDCELLS++;
                    if (this.GRID[y][x] === 0) {
                        for (let v = -1; v <= 1; v++) {
                            for (let h = -1; h <= 1; h++) {
                                if (!(v === 0 && h === 0) && this.GRID[y + v] && this.GRID[y + v][x + h] !== undefined && this.GRID[y + v][x + h] !== "X" && this.CLEARED[y + v][x + h] === "?") {
                                    this.CLEARQUEUE.push([x + h, y + v]);
                                    this.CLEARED[y + v][x + h] = "Q";
                                }
                            }
                        }
                    }
                    if (this.CLEAREDCELLS === this.TOTALCELLS) {
                        this.FLAGS = 0;
                        for (let row in this.GRID) {
                            for (let col in this.GRID[row]) {
                                if (this.GRID[row][col] === "X") {
                                    this.CLEARED[row][col] = "F";
                                    if (server.players.hasOwnProperty(username)) {
                                        server.players[username].currentGame[row][col] = "F";
                                    }
                                }
                            }
                        }
                        this.GAMEOVER = true;
                        if (server.players.hasOwnProperty(username)) {
                            server.players[username].currentGameOver = true;
                        }
                        this.WIN = true;
                        if (server.players.hasOwnProperty(username)) {
                            server.players[username].currentWin = true;
                        }
                    }
                }
                //updates currentGame for others to spectate
                // console.log("before this ", this);
                // console.log("before currentgame", server.players.currentGame);
                // server.players.currentGame = this.CLEARED;
                // server.players.currentGameStatus = this.GAMEOVER;
                // // console.log("after this ", this);
                // console.log("after currentgame", server.players.currentGame);
            }   
            // flags a cell
            flagCell(x, y, username) {
                if (this.checkCell(x, y, ["?"])) {
                    this.CLEARED[y][x] = "F";
                    if (server.players.hasOwnProperty(username)) {
                        server.players[username].currentGame[y][x] = "F";
                    }
                }
            }
            // check the 'visible' value of a cell
            checkCell(x, y, options) {
                return this.GRID[y] && this.GRID[y][x] != undefined && options.includes(this.CLEARED[y][x]);
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
                    for (let player of this.connectedSessions) {
                        player.emit("boardTime", { time: this.TIME });
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
                let players = []
                // socket.username
                for (let player of this.connectedSessions) {
                    if (sendStats) {
                        player.emit("gameStats", { timeTaken: this.GAMEDURATION, players: ["unknown"] });
                    }
                    delete player.board;
                }
            }
        },
        Game: class {
            constructor(numOfBoards, settings, teams, mode) {
                this.boards = [];
                this.mode = mode;
                this.settings = settings;
                this.teams = teams;
                for (let i = 0; i < numOfBoards; i++) {
                    this.boards.push(new Board(settings, teams[i]));
                }
            }
        }
    }

    return server.gameHandler = gameHandler;
}