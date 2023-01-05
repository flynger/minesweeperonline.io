module.exports = (server) => {
    var gameHandler = {
        Board: class {
            // creates a board
            constructor({ startX, startY, width, height, mines }, players) {
                console.log("Board created!");
                this.GRID = new Array(height).fill("").map(x => new Array(width).fill("0"));
                this.CLEARED = new Array(height).fill("").map(x => new Array(width).fill("?"));
                this.MINES = this.FLAGS = mines;
                this.CLEAREDCELLS = this.TIME = 0;
                this.GAMEOVER = this.WIN = false;
                this.TOTALCELLS = width * height - mines;
                this.CLEARQUEUE = [];
                this.sessions = players;

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
                            let isFlagged = this.GRID[row][col] === "F";
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
                                }
                            }
                        }
                        this.GAMEOVER = true;
                        this.WIN = true;
                    }
                }
                //}
            }
            // clearCell(x, y) {
            //     let value = this.GRID[y][x];
            //     // death check
            //     if (value === "X") {
            //         for (let row in this.GRID) {
            //             for (let col in this.GRID[row]) {
            //                 let isFlagged = this.GRID[row][col] === "F";
            //                 if (this.GRID[row][col] === "X") {
            //                     if (!isFlagged && this.CLEARED[row][col] != "RX") {
            //                         this.CLEARED[row][col] = "X";
            //                     }
            //                 }
            //                 else if (isFlagged) {
            //                     this.CLEARED[row][col] = "FX";
            //                 }
            //             }
            //         }
            //         this.CLEARED[y][x] = "RX";
            //         this.GAMEOVER = true; // game over
            //     } else {
            //         // if there was a flag update counter
            //         if (this.CLEARED[y][x] === "F") {
            //             this.FLAGS++;
            //         }

            //         // open the cell
            //         this.CLEARED[y][x] = value;
            //         this.CLEAREDCELLS++;

            //         // if a 0, open nearby cells
            //         if (value === 0) {
            //             // clearCells (without the function)
            //             for (let v = -1; v <= 1; v++) {
            //                 for (let h = -1; h <= 1; h++) {
            //                     if (!(v == 0 && h == 0) && this.checkCell(x + h, y + v, ["?", "F"]) && !this.CLEARQUEUE.includes((x + h) + "," + (y + v))) {
            //                         this.CLEARQUEUE.push((x + h) + "," + (y + v));
            //                     }
            //                 }
            //             }
            //         }

            //         // checks if all possible cleared cells are cleared (win code)
            //         if (this.CLEAREDCELLS === this.TOTALCELLS) {
            //             this.FLAGS = 0;
            //             for (let row in this.GRID) {
            //                 for (let col in this.GRID[row]) {
            //                     if (this.GRID[row][col] === "X") {
            //                         this.CLEARED[row][col] = "F";
            //                     }
            //                 }
            //             }
            //             this.GAMEOVER = true;
            //         }
            //     }
            // }
            // flags a cell
            flagCell(x, y) {
                if (this.checkCell(x, y, ["?"])) {
                    this.CLEARED[y][x] = "F";
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
                    console.log("counting time: ", this.TIME);
                    for (let player of this.sockets) {
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
                socket.username
                for (let player of this.sockets) {
                    if (sendStats) {
                        player.emit("gameStats", { timeTaken: this.GAMEDURATION, players: this.sockets });
                    }
                    delete player.board;
                }
            }
        }
        // clearBoard(board) {
        //     while (board.CLEARQUEUE.length > 0) {
        //         let cell = board.CLEARQUEUE.shift().split(",");
        //         board.clearCell(+cell[0], +cell[1]);
        //     }
        // },
        // createBoard(settings) {
        //     console.log("Board created!");
        //     return new this.Board(settings);
        //     // return socketToBoard[socket.id] = new this.Board(settings);
        // }
        // getBoard(socket) {
        //     return socketToBoard[socket.id];
        // },
        // hasBoard(socket) {
        //     return socket.id in socketToBoard;
        // },
        // resetBoard(socket) {
        //     if board exists, delete it
        //     if ("board" in socket) {
        //         socket.board.reset();
        //     }
        //     if (socketToBoard[socket.id]) {
        //         console.log("resetting board");
        //         if (socketToBoard[socket.id].timer) clearInterval(socketToBoard[socket.id].timer);
        //         delete socketToBoard[socket.id];
        //     }
        // }
    }

    return server.gameHandler = gameHandler;
}