var latency = 0;
var link = "localhost:3000";
var socket = io.connect(link);

socket.on("connect", (ms) => {
    // connect event
});
socket.on("pong", (ms) => {
    latency = ms;
});
socket.on("alertMessage", (data) => {
    alert(data.msg);
});
socket.on("chatMessage", (data) => {
    addChatMessage(data.user, data.msg);
});

var minesweeper;
function setup() {
    minesweeper = new Minesweeper();
    minesweeper.startGame();
}

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

        this.TOTALCELLS = (minesweeper.settings.width * minesweeper.settings.height) - minesweeper.settings.mines;
        this.OPENCELLS = 0;

        // reset board
        this.GRID = [];
        this.resetBoard();

        // create mouse events
        $("#game").on("mouseup", e => {
            e.preventDefault();
            let cell = $(e.target);
            let [x, y] = this.getCellFromID(cell.attr("id"));
            switch (e.which) {
                case 1:
                    if (cell.hasClass("empty")) {
                        if (minesweeper.GRID.length == 0) {
                            minesweeper.GRID = minesweeper.createBoard(x, y, minesweeper.settings.width, minesweeper.settings.height, minesweeper.settings.mines);
                        }
                        minesweeper.clearCell(x, y);
                    } else if (minesweeper.satisfyFlags(x, y)) {
                        minesweeper.clearCells(x, y, false);
                    }
                    break;
                case 2:
                    //alert("Middle mouse button is pressed");
                    break;
                case 3:
                    // clear cells around mouse
                    // if (game.satisfyFlags(x, y)) {
                    //     game.clearCells(x, y);
                    // }
                    break;
                default:
                    alert("Nothing");
            }
        });

        $("#game").unbind("mousedown").on("mousedown", e => {
            e.preventDefault();
            let cell = $(e.target);
            switch (e.which) {
                case 1:
                    if ($(e.target).hasClass("blank")) {
                        $(e.target).attr("class", "cell empty");
                    }
                    break;
                case 2:
                    //alert("Middle mouse button is pressed");
                    break;
                case 3:
                    let [x, y] = this.getCellFromID(cell.attr("id"));
                    this.flagAndClear(x, y, e.which == 1);
                    break;
                default:
                    alert("Nothing");
            }
        });

        $("#game").on("mouseout", e => {
            e.preventDefault();
            let cell = $(e.target);
            if (cell.hasClass("empty")) {
                cell.attr("class", "blank");
            }
        });

        $("#game").on("mouseover", e => {
            let cell = $(e.target);
            if (cell.hasClass("cell")) {
                let [x, y] = this.getCellFromID(cell.attr("id"));
                e.preventDefault();
                switch (e.buttons) {
                    case 1:
                        this.selectCell(x, y);
                        break;
                    case 3:
                        //selectCell(x, y);
                        break;
                    default:
                    // nothing
                }
                // check SPACE
                if (keyIsDown(32)) {
                    this.flagAndClear(x, y, true);
                }
            }
        });

        $("#chatInput").on("keypress", function (e) {
            // check ENTER
            if ($("#chatInput:focus") && $("#chatInput").val() && e.which === 13) {
                var typedMessage = $("#chatInput").val();
                // send chat to server
                if (typedMessage == "/ping") {
                    addServerMessage("Your ping is " + latency + "ms.")
                } else {
                    socket.emit("chatMessage", { msg: typedMessage });
                }
                // clear chat
                $("#chatInput").val("");
            }
        });
    }
    resetBoard() {
        $("#game").html("");
        $("#game").width(this.settings.width * this.TILE_SIZE + this.BORDER * 2);
        $("#game").height(this.settings.height * this.TILE_SIZE + this.BORDER * 2);

        // top border
        let grid = "";
        grid += this.createImg("borderjointl");
        grid += this.createImg("border-h").repeat(this.settings.width);
        grid += this.createImg("borderjointr");
        grid += "<br>";

        // cells
        for (let i = 0; i < this.settings.height; i++) {
            grid += this.createImg("border-v");
            for (let j = 0; j < this.settings.width; j++) {
                grid += this.createImg("blank", i + "_" + j);
            }
            grid += this.createImg("border-v");
            grid += "<br>";
        }

        // bottom border
        grid += this.createImg("borderbl");
        for (let j = 1; j <= this.settings.width; j++) {
            grid += this.createImg("border-h");
        }
        grid += this.createImg("borderbr");

        // set the html onto the grid
        $("#game").html(grid);
    }
    updateCustomSettings() {
        this.CUSTOM = { height: +$("#custom_height").val(), width: +$("#custom_width").val(), mines: +$("#custom_mines").val() };
    }
    createImg(type, id) {
        let idText = id ? "' id='" + id : "";
        return "<div class='" + type + idText + "'></div>";
    }
    createBoard(startX, startY, width, height, mines) {
        let grid = new Array(height).fill("");
        for (let row in grid) {
            grid[row] = new Array(width).fill("0");
        }

        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                if (grid[startY + v] && grid[startY + v][startX + h] && (width * height - mines >= 9 || (h == 0 && v == 0))) grid[startY + v][startX + h] = "SAFE";
            }
        }

        while (mines > 0) {
            let x = randomNumber(0, width - 1);
            let y = randomNumber(0, height - 1);
            if (grid[y][x] !== "X" && grid[y][x] !== "SAFE") {
                grid[y][x] = "X";
                mines--;
            }
        }

        for (let row in grid) {
            for (let col in grid[row]) {
                if (grid[row][col] !== "X") {
                    grid[row][col] = this.countMines(grid, +col, +row);
                }
            }
        }
        console.log(grid);
        return grid;
    }
    // count mines while generating
    countMines(grid, x, y) {
        let mines = 0;
        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                if (grid[y + v] && grid[y + v][x + h] != undefined && grid[y + v][x + h] === "X") mines++;
            }
        }
        return mines;
    }
    // count flags in order to clear area
    satisfyFlags(x, y) {
        let flags = 0;
        this.doCellOperation(x, y, (thisX, thisY, thisCell) => {
            if (thisCell.hasClass("bombflagged")) flags++;
        });
        return this.getCanvasCell(x, y).attr("class").includes("open") && flags === this.GRID[y][x];
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
        
        this.OPENCELLS++;
        if(this.OPENCELLS === this.TOTALCELLS) {
            for (let row in this.GRID) {
                for (let col in this.GRID[row]) {
                    if (this.GRID[row][col] === "X") {
                        this.getCanvasCell(col, row).attr("class", "bombflagged");
                    }
                }
            }
        }

        // if a 0, open nearby cells
        if (cell === 0) {
            this.clearCells(x, y, true);
        }
    }
    clearCells(x, y, overrideFlags) {
        this.doCellOperation(x, y, (thisX, thisY, thisCell) => {
            if (thisCell.hasClass("blank") || (overrideFlags && thisCell.hasClass("bombflagged"))) this.clearCell(thisX, thisY);
        });
        // for (let v = -1; v <= 1; v++) {
        //     for (let h = -1; h <= 1; h++) {
        //         let thisX = x + h;
        //         let thisY = y + v;
        //         if (this.getCanvasCell(thisX, thisY).length && this.getCanvasCell(thisX, thisY).hasClass("blank")) this.clearCell(thisX, thisY);
        //     }
        // }
    }
    flagAndClear(x, y, clearCondition) {
        let cell = this.getCanvasCell(x, y);
        if (cell.hasClass("blank")) {
            // if cell blank, add flag
            cell.attr("class", "cell bombflagged");
        } else if (cell.hasClass("bombflagged")) {
            // if flag, revert to blank
            cell.attr("class", "blank");
        } else if (clearCondition) {
            // if left click is on, clear cells
            minesweeper.clearCells(x, y, false);
        }
    }
    getCanvasCell(x, y) {
        return $(`#${y}_${x}`);
    }
    getCellFromID(id) {
        let [cellY, cellX] = id.split("_");
        // return x, y of cell
        return [+cellX, +cellY];
    }
    selectCell(x, y) {
        let cell = this.getCanvasCell(x, y);
        // if cell exists and is blank
        if (cell.length && cell.hasClass("blank")) {
            cell.attr("class", "empty");
        }
    }
    selectCells(x, y) {
        // if cell exists and is blank
        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                let cell = this.getCanvasCell(x + h, y + v);
                if (cell.length && cell.hasClass("blank")) this.selectCell(x + h, y + v);
            }
        }
    }
    doCellOperation(x, y, func) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
            for (let nx = x - 1; nx <= x + 1; nx++) {
                let cell = this.getCanvasCell(nx, ny);
                if (cell.length) func(nx, ny, cell);
            }
        }
    }
    deselectAllCells() {
        // let cell = this.getCanvasCell(x, y);
        // if ($(cell).hasClass("blank")) {
        //     $(cell).attr("class", "empty");
        // }
    }
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addChatMessage(user, msg) {
    $("#chatText").html($("#chatText").html() + "<br> " + user + " said: " + msg);
}

function addServerMessage(msg) {
    $("#chatText").html($("#chatText").html() + "<br> <text color='red'>" + msg + "</text>");
}