var Minesweeper = {
    BEGINNER: { height: 9, width: 9, mines: 10 },
    INTERMEDIATE: { height: 16, width: 16, mines: 40 },
    EXPERT: { height: 16, width: 30, mines: 99 },
    CUSTOM: { height: 20, width: 30, mines: 145 },
    startGame() {
        document.getElementById("game").innerHTML = "";
        this.settings = this[$("input[name='difficulty']:checked").val()];
        document.getElementById("game").style.width = this.settings.width * 16 + "px";
        document.getElementById("game").style.height = this.settings.height * 16 + "px";
        for (var i = 1; i <= this.settings.height; i++) {
            for (var j = 1; j <= this.settings.width; j++) {
                document.getElementById("game").innerHTML += '<div class="square blank" id="' + i + '_' + j + '"></div>';
            }
            document.getElementById("game").innerHTML += "<br>";
        }
    },
    updateCustomSettings() {
        this.CUSTOM = { height: $("#custom_height").val(), width: $("#custom_width").val(), mines: $("#custom_mines").val() };
    }
}

function createBoard(width, height, mines) {
    var grid = new Array(height).fill("");
    for (row in grid) {
        grid[row] = new Array(width).fill("0");
    }

    while (mines > 0) {
        var x = randomNumber(0, width - 1);
        var y = randomNumber(0, height - 1);
        if (grid[y][x] !== "⚑") {
            grid[y][x] = "⚑";
            mines--;
        }
    }

    for (row in grid) {
        for (col in grid[row]) {
            if (grid[row][col] !== "⚑") {
                grid[row][col] = countMines(+col, +row);
            }
        }
        console.log(grid[row].join(" "));
    }

    function randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function countMines(x, y) {
        var mines = 0;
        for (var v = -1; v <= 1; v++) {
            for (var h = -1; h <= 1; h++) {
                if (grid[y + v] && grid[y + v][x + h] && grid[y + v][x + h] === "⚑") mines++;
            }
        }
        return mines > 0 ? mines : " ";
    }
}