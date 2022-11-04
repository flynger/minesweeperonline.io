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
    // count flags in order to clear area
    satisfyFlags(x, y) {
        var flags = 0;
        this.doCellOperation(x, y, (thisX, thisY, thisCell) => {
            if (thisCell.hasClass("bombflagged")) flags++;
        });
        return this.getCanvasCell(x, y).attr('class').includes("open") && flags === this.GRID[y][x];
    }
    clearCell(x, y) {
        let cell = this.GRID[y][x];
        let classToAdd;
        // death check
        if (cell === "X") {
            for (let row in this.GRID) {
                for (let col in this.GRID[row]) {
                    var isFlagged = this.getCanvasCell(col, row).hasClass("bombflagged");
                    if (this.GRID[row][col] === "X") {
                        if (!isFlagged) {
                            this.getCanvasCell(col, row).attr("class", "bombrevealed");
                        }
                    }
                    else if (isFlagged) {
                        this.getCanvasCell(col, row).attr("class", "bombmisflagged");
                    }
                }
            }
            $("#game").off();
            classToAdd = "bombdeath";
        } else {
            classToAdd = "open" + cell;
        }
        // open the cell
        this.getCanvasCell(x, y).attr("class", classToAdd);
        // if a 0, open nearby cells
        if (cell === 0) {
            this.clearCells(x, y);
        }
    }
    clearCells(x, y) {
        this.doCellOperation(x, y, (thisX, thisY, thisCell) => {
            if (thisCell.hasClass("blank")) this.clearCell(thisX, thisY);
        });
        // for (let v = -1; v <= 1; v++) {
        //     for (let h = -1; h <= 1; h++) {
        //         let thisX = x + h;
        //         let thisY = y + v;
        //         if (this.getCanvasCell(thisX, thisY).length && this.getCanvasCell(thisX, thisY).hasClass("blank")) this.clearCell(thisX, thisY);
        //     }
        // }
    }
    doCellOperation(x, y, func) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
            for (let nx = x - 1; nx <= x + 1; nx++) {
                let cell = this.getCanvasCell(nx, ny);
                if (cell.length) func(nx, ny, cell);
            }
        }
    }
}

randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}