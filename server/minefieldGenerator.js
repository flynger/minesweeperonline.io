module.exports = class Minesweeper {
    // create board
    constructor({ startX, startY, width, height, mines }) {
        this.MINES = mines;
        this.GRID = new Array(height).fill("");

        for (let row in this.GRID) {
            this.GRID[row] = new Array(width).fill("0");
        }

        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                if (this.GRID[startY + v] && this.GRID[startY + v][startX + h] && (width * height - mines >= 9 || (h == 0 && v == 0))) this.GRID[startY + v][startX + h] = "SAFE";
            }
        }

        while (mines > 0) {
            let x = randomNumber(0, width - 1);
            let y = randomNumber(0, height - 1);
            if (this.GRID[y][x] !== "X" && this.GRID[y][x] !== "SAFE") {
                this.GRID[y][x] = "X";
                mines--;
            }
        }

        for (let row in this.GRID) {
            for (let col in this.GRID[row]) {
                if (this.GRID[row][col] !== "X") {
                    this.GRID[row][col] = this.countMines(this.GRID, +col, +row);
                }
            }
        }
        console.log(this.GRID);
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
}