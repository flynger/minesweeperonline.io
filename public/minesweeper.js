var latency = 0;
var client = {
    socket: null,
    init: (link) => {
        client.socket = io.connect(link);

        client.socket.on('pong', (ms) => {
            latency = ms;
        });
        client.socket.on("loginFail", () => {
            alert("Login failed. Your username or password is incorrect.");
        });
        client.socket.on("loginSuccess", (data) => {
            //alert("You have logged in successfully.");
        });
        client.socket.on("signUp", (data) => {
            alert("Your account has been created and you have been logged in.");
        });
        client.socket.on("signUpExists", (data) => {
            alert("Sign up failed. This username has already been taken.");
        });
        client.socket.on("signUpFail", (data) => {
            alert("Sign up failed. Invalid parameters.");
        });
        client.socket.on("nameError", (data) => {
            alert("Invalid username. A username may only include alphanumeric characters, underscores, and be a length of 3 to 16 characters.");
        });
        client.socket.on("passError", (data) => {
            alert("Invalid password. A password must include 1 lowercase letter, 1 uppercase letter, 1 number, and be at least 8 characters long.");
        });
        client.socket.on("doubleError", (data) => {
            alert("This user is already logged in.");
        });

        client.socket.on("kickEvent", (data) => {
            if (data.kicked) {
                alert("You have been kicked from the server by " + data.name + ".");
                client.socket.disconnect();
            }
        });
        client.socket.on("onConnect", (data) => {

        });
        client.socket.on("sendDisconnect", (data) => {
            if (players[data.id] && players[data.id].name == data.id) {
                objects.layers[2].splice(objects.layers[2].indexOf(players[data.id]), 1);
                delete players[data.id];
            }
        });
        client.socket.on("serverDown", () => {
            setInterval(addChatMessage, 250, { user: "YourMom", msg: "<text style=\"color: red;\">Time to sleep little timmy</text>" });
            //addChatMessage();
        });
        client.socket.on("alertMessage", (data) => {
            alert(data.msg);
        });
        client.socket.on("chatMessage", (data) => {
            addChatMessage(data.user, data.msg);
        });

    },
    send: (data, key) => {
        if (!key) key = "send";
        client.socket.emit(key, data);
    }
}

function sendEvent(name) {
    client.send(client.socket.id, name);
}

// client.init("73.225.174.140:3000");
// client.init("localhost:3000");
client.init("10.40.30.150:3000");

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
        $("#game").data("game", this);
        console.log($("#game").data("game"));

        // create mouse events
        $("#game").on("mouseup", { game: $("#game").data("game") }, e => {
            e.preventDefault();
            let game = e.data.game;
            let [x, y] = this.getCellFromID($(e.target).attr("id"));
            switch (e.which) {
                case 1:
                    if ($(e.target).hasClass("empty")) {
                        if (game.GRID.length == 0) {
                            game.GRID = game.createBoard(x, y, game.settings.width, game.settings.height, game.settings.mines);
                        }
                        game.clearCell(x, y);
                    } else if (game.satisfyFlags(x, y)) {
                        game.clearCells(x, y);
                    }
                    break;
                case 2:
                    //alert('Middle mouse button is pressed');
                    break;
                case 3:
                    // clear cells around mouse
                    // if (game.satisfyFlags(x, y)) {
                    //     game.clearCells(x, y);
                    // }
                    break;
                default:
                    alert('Nothing');
            }
        });

        $("#game").unbind("mousedown").on("mousedown", { game: $("#game").data("game") }, e => {
            e.preventDefault();
            switch (e.which) {
                case 1:
                    if ($(e.target).hasClass("blank")) {
                        $(e.target).attr("class", "cell empty");
                    }
                    break;
                case 2:
                    //alert('Middle mouse button is pressed');
                    break;
                case 3:
                    if ($(e.target).hasClass("blank")) {
                        // if cell blank, add flag
                        $(e.target).attr("class", "cell bombflagged");
                    } else if ($(e.target).hasClass("bombflagged")) {
                        // if flag, revert to blank
                        $(e.target).attr("class", "blank");
                    } else if (e.which == 1) {
                        // if left click is on, clear cells
                        e.data.game.clearCells(x, y);
                    }
                    break;
                default:
                    alert('Nothing');
            }
        });

        $("#game").on("mouseout", e => {
            e.preventDefault();
            if ($(e.target).hasClass("empty")) {
                $(e.target).attr("class", "blank");
            }
        });

        $("#game").on("mouseover", { game: $("#game").data("game") }, e => {
            e.preventDefault();
            switch (e.buttons) {
                case 1:
                    let [x, y] = this.getCellFromID($(e.target).attr("id"));
                    e.data.game.selectCell(x, y);
                    break;
                case 3:
                    //selectCell(x, y);
                    break;
                default:
                // nothing
            }
        });

        $("#chatInput").on('keypress', function (e) {
            // check ENTER go send chat
            if ($("#chatInput:focus") && $("#chatInput").val() && e.which === 13) {
                client.socket.data = { msg: $("#chatInput").val() };
                client.send(client.socket, "chatMessage");
                $("#chatInput").val("");
            }
        });
    }
    updateCustomSettings() {
        this.CUSTOM = { height: +$("#custom_height").val(), width: +$("#custom_width").val(), mines: +$("#custom_mines").val() };
    }
    createImg(type, id) {
        let idText = id ? '" id="' + id : "";
        return '<div class="' + type + idText + '"></div>';
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
    getCanvasCell(x, y) {
        return $("#" + y + "_" + x);
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