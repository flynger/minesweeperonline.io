module.exports = class Board {
    // create board
    constructor({ startX, startY, width, height, mines }) {
        this.GRID = new Array(height).fill("").map(x => new Array(width).fill("0"));
        this.CLEARED = new Array(height).fill("").map(x => new Array(width).fill("?"));
        this.MINES = this.FLAGS = mines;
        this.CLEAREDCELLS = 0;
        this.TOTALCELLS = width * height - mines;
        this.TIME = 0;

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

        for (let row in this.GRID) {
            for (let col in this.GRID[row]) {
                if (this.GRID[row][col] !== "X") {
                    this.GRID[row][col] = this.countMines(+col, +row);
                }
            }
        }
        this.clearCell(startX, startY);
    }
    countMines(x, y) {
        let mines = 0;
        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                if (this.GRID[y + v] && this.GRID[y + v][x + h] != undefined && this.GRID[y + v][x + h] === "X") mines++;
            }
        }
        return mines;
    }
    clearCell(x, y) {
        console.log("clearing cell at ("+x+", "+y+")");
        let value = this.GRID[y][x];
        // death check
        if (value === "X") {
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
            // if there was a flag update counter
            if (this.CLEARED[y][x] === "F") {
                this.FLAGS++;
            }

            // open the cell
            this.CLEARED[y][x] = value;
            this.CLEAREDCELLS++;

            // if a 0, open nearby cells
            if (value === 0) {
                // clearCells (without the function)
                for (let v = -1; v <= 1; v++) {
                    for (let h = -1; h <= 1; h++) {
                        if (!(v == 0 && h == 0) && this.checkCell(x + h, y + v, ["?", "F"])) this.clearCell(x + h, y + v);
                    }
                }
            }

            // checks if all possible cleared cells are cleared (win code)
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
            }
        }
    }
    flagCell(x, y) {
        if (this.checkCell(x, y, ["?"])) {
            this.CLEARED[y][x] = "F";
        }
    }
    checkCell(x, y, options) {
        return this.GRID[y] && this.GRID[y][x] != undefined && options.includes(this.CLEARED[y][x]);
    }
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}