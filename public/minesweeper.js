var mouseHeldDown = false;

class Minesweeper {
    constructor() {
        this.TILE_SIZE = 32,
        this.BORDER = 20,
        this.BEGINNER = { height: 9, width: 9, mines: 10 },
        this.INTERMEDIATE = { height: 16, width: 16, mines: 40 },
        this.EXPERT = { height: 16, width: 30, mines: 99 },
        this.CUSTOM = { height: 20, width: 30, mines: 145 },
        this.GRID = []
    }
    startGame() {
        // get difficulty
        this.settings = this[$("input[name='difficulty']:checked").val()];

        // reset board
        this.GRID = [];
        $("#game").html("");
        $("#game").width(this.settings.width * this.TILE_SIZE + this.BORDER * 2);
        $("#game").height(this.settings.height * this.TILE_SIZE + this.BORDER * 2);

        // top border
        var grid = "";
        grid += this.createImg("borderjointl");
        grid += this.createImg("border-h").repeat(this.settings.width);
        grid += this.createImg("borderjointr");
        grid += "<br>";

        // cells
        for (var i = 0; i < this.settings.height; i++) {
            grid += this.createImg("border-v");
            for (var j = 0; j < this.settings.width; j++) {
                grid += this.createImg("square blank", i + "_" + j);
            }
            grid += this.createImg("border-v");
            grid += "<br>";
        }

        // bottom border
        grid += this.createImg("borderbl");
        for (var j = 1; j <= this.settings.width; j++) {
            grid += this.createImg("border-h");
        }
        grid += this.createImg("borderbr");

        // set the html onto the grid
        $("#game").html(grid);

        // create mouse events
        $("#game").on("mouseup", {}, function (e) {
            // NO THIS
            mouseHeldDown = false;
            e.preventDefault();
            if ($(e.target).hasClass("empty")) {
                var id = $(e.target).attr("id").split("_");
                var x = id[1];
                var y = id[0];
                if (!minesweeper.GRID) {
                    minesweeper.createBoard(x, y, minesweeper.settings.width, minesweeper.settings.height, minesweeper.settings.mines);
                }
                var cell = minesweeper.GRID[y][x];
                if (cell === "X") {
                    for (var row in minesweeper.GRID) {
                        for (var col in minesweeper.GRID[row]) {
                            if (minesweeper.GRID[row][col] === "X") {
                                $("#" + row + "_" + col).attr("class", "square bombrevealed");
                            }
                        }
                    }
                    cell = "bombdeath";
                    // death code
                } else {
                    cell = "open" + cell;
                }
                $(e.target).attr("class", "square " + cell);
            }
            console.log(e.target);
        });

        $("#game").on("mousedown", function (e) {
            mouseHeldDown = true;
            e.preventDefault();
            if ($(e.target).hasClass("blank")) {
                $(e.target).attr("class", "square empty");
            }
        });

        $("#game").on("mouseout", function (e) {
            e.preventDefault();
            if ($(e.target).hasClass("empty")) {
                $(e.target).attr("class", "square blank");
            }
        });

        $("#game").on("mouseover", function (e) {
            e.preventDefault();
            if (mouseHeldDown && $(e.target).hasClass("blank")) {
                $(e.target).attr("class", "square empty");
            }
        });
    }
    updateCustomSettings() {
        this.CUSTOM = { height: +$("#custom_height").val(), width: +$("#custom_width").val(), mines: +$("#custom_mines").val() };
    }
    createImg(type, id) {
        var idText = "";
        if (id) idText += '" id="' + id;
        return '<div class="' + type + idText + '"></div>';
    }
    createBoard(startX, startY, width, height, mines) {
        this.GRID = new Array(height).fill("");
        for (var row in this.GRID) {
            this.GRID[row] = new Array(width).fill("0");
        }

        for (var v = -1; v <= 1; v++) {
            for (var h = -1; h <= 1; h++) {
                if (this.GRID[startY + v] && this.GRID[startY + v][startX + h]) this.GRID[startY + v][startX + h] = "SAFE";
            }
        }

        while (mines > 0) {
            var x = randomNumber(0, width - 1);
            var y = randomNumber(0, height - 1);
            if (this.GRID[y][x] !== "X" && this.GRID[y][x] !== "SAFE") {
                this.GRID[y][x] = "X";
                mines--;
            }
        }

        for (var row in this.GRID) {
            for (var col in this.GRID[row]) {
                if (this.GRID[row][col] !== "X") {
                    this.GRID[row][col] = this.countMines(+col, +row);
                }
            }
        }
        console.log(this.GRID);
    }
    countMines(x, y) {
        var mines = 0;
        for (var v = -1; v <= 1; v++) {
            for (var h = -1; h <= 1; h++) {
                if (this.GRID[y + v] && this.GRID[y + v][x + h] && this.GRID[y + v][x + h] === "X") mines++;
            }
        }
        return mines;
    }
    getGrid() {
        return this.GRID;
    }
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}