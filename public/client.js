var latency = 0;
var link = "73.109.23.105:3000";
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
    // setup events
    $(".difficulty-select").on("change", minesweeper.updateCustomSettings);
    $(".difficulty-select").on("click", e => {
        e.target.blur(); // TODO: fix this
        $('#custom').prop('checked', true);
    });
    $("#startGame").on("click", e => {
        e.target.blur();
        minesweeper.startGame();
    });
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

        this.TOTALCELLS = (this.settings.width * this.settings.height) - this.settings.mines;
        this.OPENCELLS = 0;

        var hoverCell, hoverX, hoverY;

        // reset board
        this.GRID = [];
        this.resetBoard();

        // create mouse events
        $("#game").unbind("mousedown").on("mousedown", e => {
            e.preventDefault();
            let cell = $(e.target);
            let [x, y] = this.getCellFromID(cell.attr("id"));
            switch (e.which) {
                case 1:
                    if (cell.hasClass("blank")) {
                        this.selectCell(x, y);
                    } else if (this.cellIsClear(cell)) {
                        this.selectCells(x, y);
                    }
                    break;
                case 2:
                    //alert("Middle mouse button is pressed");
                    break;
                case 3:
                    this.flagAndClear(x, y, e.which == 1);
                    break;
                default:
                    alert("Nothing");
            }
        });

        $("#game").unbind("mouseup").on("mouseup", e => {
            e.preventDefault();
            let cell = $(e.target);
            let [x, y] = this.getCellFromID(cell.attr("id"));
            switch (e.which) {
                case 1:
                    if (cell.hasClass("selected")) {
                        // if game doesn't exist, create one
                        if (this.GRID.length == 0) {
                            this.GRID = this.createBoard(x, y, this.settings.width, this.settings.height, this.settings.mines);
                        }
                        this.clearCell(x, y);
                    } else if (this.satisfyFlags(x, y)) {
                        this.clearCells(x, y, false);
                    }
                    else this.deselectCells(x, y);
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

        $("#game").on("mouseover", e => {
            let cell = $(e.target);
            if (cell.hasClass("cell")) {
                hoverCell = cell;
                [hoverX, hoverY] = this.getCellFromID(hoverCell.attr("id"));
                e.preventDefault();
                switch (e.buttons) {
                    case 1:
                        if (cell.hasClass("blank")) {
                            this.selectCell(hoverX, hoverY);
                        } else if (this.cellIsClear(cell)) {
                            this.selectCells(hoverX, hoverY);
                        }
                        break;
                    case 3:
                        //selectCell(x, y);
                        break;
                    default:
                    // nothing
                }
            }
            else {
                hoverCell = null;
                hoverX, hoverY = null;
            }
        });

        $("#game").on("mouseout", e => {
            e.preventDefault();
            let cell = $(e.target);
            let [x, y] = this.getCellFromID(cell.attr("id"));
            // console.log(cell);
            this.deselectCells(x, y);
        });

        $(document).unbind("keypress").on("keypress", e => {
            // console.log(hoverCell)
            if (e.which === 32 && e.target == document.body) {
                // check SPACE
                e.preventDefault();
                if (hoverCell && hoverCell.hasClass("cell")) {
                    this.flagAndClear(hoverX, hoverY, true);
                }
            }
        });

        $("#chatInput").on("keypress", e => {
            // check ENTER
            if ($("#chatInput:focus") && $("#chatInput").val() && e.which === 13) {
                let typedMessage = $("#chatInput").val();
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
                grid += this.createImg("cell blank", i + "_" + j);
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
        return this.cellIsClear(this.getCanvasCell(x, y)) && flags === this.GRID[y][x];
    }
    clearCell(x, y) {
        let cell = this.GRID[y][x];
        let classToAdd;
        // death check
        if (cell === "X") {
            for (let row in this.GRID) {
                for (let col in this.GRID[row]) {
                    let isFlagged = this.getCanvasCell(col, row).hasClass("bombflagged");
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
            classToAdd = "cell open" + cell;
            this.OPENCELLS++;
        }
        // open the cell
        this.getCanvasCell(x, y).attr("class", classToAdd);

        // checks if all possible cleared cells are cleared (win code)
        if (this.OPENCELLS === this.TOTALCELLS) {
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
            if (!this.cellIsClear(thisCell) && ((thisCell.hasClass("selected") || overrideFlags))) this.clearCell(thisX, thisY);
        });
    }
    cellIsClear(cell) {
        return cell.attr("class").includes("open");
    }
    flagAndClear(x, y, clearCondition) {
        let cell = this.getCanvasCell(x, y);
        if (cell.hasClass("blank")) {
            // if cell blank, add flag
            cell.attr("class", "cell bombflagged");
        } else if (cell.hasClass("bombflagged")) {
            // if flag, revert to blank
            cell.attr("class", "cell blank");
        } else if (clearCondition && this.satisfyFlags(x, y)) {
            // if left click is on, clear cells
            this.clearCells(x, y, false);
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
            cell.attr("class", "cell selected");
        }
    }
    selectCells(x, y) {
        // if any of 3x3 is blank, select it
        this.doCellOperation(x, y, (thisX, thisY, cell) => {
            this.selectCell(thisX, thisY);
        });
    }
    deselectCell(x, y) {
        let cell = this.getCanvasCell(x, y);
        // if cell exists and is selected
        if (cell.length && cell.hasClass("selected")) {
            cell.attr("class", "cell blank");
        }
    }
    deselectCells(x, y) {
        // if cell exists and is blank
        this.doCellOperation(x, y, (thisX, thisY, cell) => {
            this.deselectCell(thisX, thisY);
        });
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

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addChatMessage(user, msg) {
    $("#chatText").html($("#chatText").html() + "<br> " + user + " said: " + msg);
    $("#chatText")[0].scrollTo(0, $("#chatText")[0].scrollHeight);
}

function addServerMessage(msg) {
    $("#chatText").html($("#chatText").html() + "<br> <text color='red'>" + msg + "</text>");
}