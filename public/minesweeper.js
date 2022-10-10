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
        $("#game").data("game", this);
        console.log($("#game").data("game"));

        // create mouse events
        $("#game").on("mouseup", {game: $("#game").data("game")}, function (e) {
            // NO THIS
            var game = e.data.game;
            mouseHeldDown = false;
            e.preventDefault();
            if ($(e.target).hasClass("empty")) {
                var id = $(e.target).attr("id").split("_");
                var x = +id[1];
                var y = +id[0];
                console.log(game);
                if (game.GRID.length == 0) {
                    game.GRID = game.createBoard(x, y, game.settings.width, game.settings.height, game.settings.mines);
                }
                console.log(game);
                var cell = game.GRID[y][x];
                if (cell === "X") {
                    for (var row in game.GRID) {
                        for (var col in game.GRID[row]) {
                            if (game.GRID[row][col] === "X") {
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
        var grid = new Array(height).fill("");
        for (var row in grid) {
            grid[row] = new Array(width).fill("0");
        }

        for (var v = -1; v <= 1; v++) {
            for (var h = -1; h <= 1; h++) {
                if (grid[startY + v] && grid[startY + v][startX + h] && (width * height - mines >= 9 || (h == 0 && v == 0))) grid[startY + v][startX + h] = "SAFE";
            }
        }

        while (mines > 0) {
            var x = randomNumber(0, width - 1);
            var y = randomNumber(0, height - 1);
            if (grid[y][x] !== "X" && grid[y][x] !== "SAFE") {
                grid[y][x] = "X";
                mines--;
            }
        }

        for (var row in grid) {
            for (var col in grid[row]) {
                if (grid[row][col] !== "X") {
                    grid[row][col] = this.countMines(grid, +col, +row);
                }
            }
        }
        console.log(grid);
        return grid;
    }
    countMines(grid, x, y) {
        var mines = 0;
        for (var v = -1; v <= 1; v++) {
            for (var h = -1; h <= 1; h++) {
                if (grid[y + v] && grid[y + v][x + h] && grid[y + v][x + h] === "X") mines++;
            }
        }
        return mines;
    }
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}