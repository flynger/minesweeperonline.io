var minesweeper;

let { chording = "ALL" } = localStorage;
// if (!chording) { localStorage.setItem("chording", "ALL") };
var CHORDING = { setting: chording, isSPACE: chording === "SPACE", isLRCLICK: chording === "LRCLICK", isLCLICK: chording === "LCLICK" };

// default expert difficulty selected
var selectedDifficulty = "EXPERT";

// custom names for keycodes
const KEYCODE = {
    LEFT_CLICK: 1, // LMB
    RIGHT_CLICK: 3, // RMB
    ENTER: 13, // ENTER
    SPACE: 32, // SPACE
    C: 67, // C
    T: 84, // T
    BACKTICK: 96, // `
    c: 99, // c
    t: 116 // t
};

// code run on startup
$(function () {
    minesweeper = new Minesweeper();
    //checking spectate
    let paths = window.location.pathname.split("/");
    if (paths.length == 2 && paths[1] === 'spectate') {
        // minesweeper.startGame(true);
        // socket.emit('spectate', paths[2]);
        $.post(window.location.pathname + window.location.search, "", (response) => {
            if (response.success) {
                socket.emit("startSpectating", { name: response.username });
                $("#options").html("Spectating " + response.displayName);
            } else {
                $("#dialog-text").html(response.reason);
                $("#dialog-confirm").dialog({
                    title: "Cannot spectate",
                    resizable: false,
                    draggable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        "Go Back": function () {
                            $(this).dialog("close");
                            window.location.href = "/play";
                        }
                    }
                });
            }
        });
        $("#options").html("Spectating");
    } else {
        minesweeper.startGame(false);

        // set difficulty setting mins and maxes
        $("#custom_height").attr({
            "min": minesweeper.MIN.height,
            "max": minesweeper.MAX.height
        });
        $("#custom_width").attr({
            "min": minesweeper.MIN.width,
            "max": minesweeper.MAX.width
        });

        $("#custom").on("click", () => {
            if (minesweeper.HOST) {
                $(".difficulty-select").toggle();
                $("#custom-settings").toggle();
            }
        });

        // setup events
        $(".difficulty-select").on("click", e => {
            if (minesweeper.HOST) {
                let $e = $(e.currentTarget).closest('.difficulty-select');
                selectedDifficulty = $e.attr("value");
                minesweeper.startGame();
            }
        });

        $(".custom-select").on("change", e => {
            if (minesweeper.HOST) {
                // limit height and width
                limitInput($("#custom_height"), minesweeper.MIN.height, minesweeper.MAX.height)
                limitInput($("#custom_width"), minesweeper.MIN.width, minesweeper.MAX.width)

                // limit mines
                let maxMines = +$("#custom_height").val() * +$("#custom_width").val() - 1;
                limitInput($("#custom_mines"), minesweeper.MIN.mines, maxMines)

                // update mins and maxes of element
                $("#custom_mines").attr({
                    "min": minesweeper.MIN.mines,
                    "max": maxMines
                });
                minesweeper.updateCustomSettings();
                selectedDifficulty = "CUSTOM";
                minesweeper.startGame();
            }
        });
    }
    setupChat(); // chat setup
    $(document).unbind("keypress").on("keypress", e => {
        if ((e.which === KEYCODE.T || e.which === KEYCODE.t) && e.target == document.body) {
            // check BACKTICK
            e.preventDefault();
            if (!$("#chat-body").is(":visible")) toggleChat();
            $("#chatInput").focus();
        } else if ((e.which === KEYCODE.C || e.which === KEYCODE.c) && e.target == document.body) {
            // check BACKTICK
            e.preventDefault();
            toggleChat();
        }
    });
});

// minesweeper class
class Minesweeper {
    constructor() {
        this.TILE_SIZE = 32,
            this.BORDER = 20,
            this.BEGINNER = { height: 9, width: 9, mines: 10 },
            this.INTERMEDIATE = { height: 16, width: 16, mines: 40 },
            this.EXPERT = { height: 16, width: 30, mines: 99 },
            this.CUSTOM = { height: 20, width: 30, mines: 145 },
            this.MIN = { height: 1, width: 8, mines: 1 },
            this.MAX = { height: 100, width: 50 },
            this.GRID = [],
            this.SPECTATING = false,
            this.LRCLICK = false
    }
    startGame(isSpectating = false, isHost = true) {
        // tell server to stop game
        if (!isSpectating && isHost) {
            socket.emit("resetBoard", {});
            // update custom settings before creating board
            this.updateCustomSettings();
            this.SETTINGS = this[selectedDifficulty];
        }
        this.TOTALCELLS = (this.SETTINGS.width * this.SETTINGS.height) - this.SETTINGS.mines;
        this.OPENCELLS = 0;
        this.FLAGS = this.SETTINGS.mines;
        this.hoverCell, this.hoverX, this.hoverY = null;
        this.SPECTATING = isSpectating;
        this.HOST = isHost;

        // reset board and input events
        this.GRID = new Array(this.SETTINGS.height).fill("").map(x => new Array(this.SETTINGS.width).fill("?"));
        this.boardExists = false;
        this.resetBoard();
        this.updateFlagCounter();
        if (!isSpectating) {
            if (!isHost) {
                $("#face").unbind("mouseup mouseout");
            }
            this.createMouseEvents();
            this.createKeyboardEvents();
        } else {
            $("#game").unbind("mousedown mouseup mouseout mouseover");
        }

        // if (!isHost) {

        // }
    }
    resetBoard() {
        $("#game").html("");
        $("#game").width(this.SETTINGS.width * this.TILE_SIZE + this.BORDER * 2);
        $("#game").height(this.SETTINGS.height * this.TILE_SIZE + this.BORDER * 4 + 46);
        $("#result-block")[0].style.display = "none";

        let grid = "";
        // game gui
        grid += this.createImg("bordertl");
        grid += this.createImg("border-h").repeat(this.SETTINGS.width);
        grid += this.createImg("bordertr");
        grid += "<br>";

        grid += this.createImg("border-vlong");
        // grid += this.createImg("flagsicon flagsicon", "flagsicon")
        grid += this.createImg("time0", "mines_hundreds");
        grid += this.createImg("time0", "mines_tens");
        grid += this.createImg("time0", "mines_ones");

        // - 48.5 when adding flag and time icon
        let margin = 364 - (this.TILE_SIZE / 2) * (30 - this.SETTINGS.width);
        grid += this.createImg("facesmile", "face", "margin-left:" + margin + "px; margin-right: " + margin + "px;"); // , this.SPECTATING ? "" : "onclick='minesweeper.startGame()'"
        // grid += this.createImg("timeicon timeicon", "timeicon");
        grid += this.createImg("time0", "seconds_hundreds");
        grid += this.createImg("time0", "seconds_tens");
        grid += this.createImg("time0", "seconds_ones");
        grid += this.createImg("border-vlong");
        grid += "<br>";

        // top border
        grid += this.createImg("borderjointl");
        grid += this.createImg("border-h").repeat(this.SETTINGS.width);
        grid += this.createImg("borderjointr");
        grid += "<br>";

        // cells
        for (let i = 0; i < this.SETTINGS.height; i++) {
            grid += this.createImg("border-v");
            for (let j = 0; j < this.SETTINGS.width; j++) {
                grid += this.createImg("cell blank", i + "_" + j);
            }
            grid += this.createImg("border-v");
            grid += "<br>";
        }

        // bottom border
        grid += this.createImg("borderbl");
        for (let j = 1; j <= this.SETTINGS.width; j++) {
            grid += this.createImg("border-h");
        }
        grid += this.createImg("borderbr");

        // set the grid as html
        $("#game").html(grid);
    }
    updateCustomSettings() {
        this.CUSTOM = { height: +$("#custom_height").val(), width: +$("#custom_width").val(), mines: +$("#custom_mines").val() };
    }
    createImg(type, id, style, other) {
        let idText = id ? "' id='" + id : "";
        let styleText = style ? "' style='" + style : "";
        let otherText = other ? "' " + other : "";
        return "<div class='" + type + idText + styleText + otherText + "'></div>";
    }
    createMouseEvents() {
        $("#game")
            .unbind("mousedown mouseup")
            .on("mousedown", e => {
                e.preventDefault();
                let cell = $(e.target);
                if (cell.hasClass("cell")) {
                    let [x, y] = this.getCellFromID(cell.attr("id"));
                    if (e.buttons === 3 && this.cellIsClear(cell) && CHORDING.isLRCLICK) {
                        this.selectCells(x, y);
                        $("#face").attr("class", "faceooh");
                        this.LRCLICK = true;
                        return;
                    }
                    switch (e.which) {
                        case KEYCODE.LEFT_CLICK:
                            if (cell.hasClass("blank")) {
                                this.selectCell(x, y);
                                $("#face").attr("class", "faceooh");
                            } else if (!(this.boardExists && (CHORDING.isSPACE || CHORDING.isLRCLICK)) && this.cellIsClear(cell)) {
                                this.selectCells(x, y);
                                $("#face").attr("class", "faceooh");
                            }
                            break;
                        case KEYCODE.RIGHT_CLICK:
                            this.flagAndClear(x, y, false);
                            break;
                        default:
                        // do nothing
                    }
                }
            })

            .on("mouseup", e => {
                e.preventDefault();
                let cell = $(e.target);
                if (cell.hasClass("cell")) {
                    let [x, y] = this.getCellFromID(cell.attr("id"));
                    if (this.LRCLICK) {
                        if (this.satisfyFlags(x, y)) {
                            this.flagAndClear(x, y, true);
                        } else this.deselectCells(x, y);
                        $("#face").attr("class", "facesmile");
                        return;
                    }
                    switch (e.which) {
                        case KEYCODE.LEFT_CLICK:
                            if (cell.hasClass("selected")) {
                                // if game doesn't exist, create one
                                if (!this.boardExists) {
                                    // this.GRID = this.createBoard(x, y, this.SETTINGS.width, this.SETTINGS.height, this.SETTINGS.mines);
                                    socket.emit("createBoard", { startX: x, startY: y, width: this.SETTINGS.width, height: this.SETTINGS.height, mines: this.SETTINGS.mines });
                                    this.boardExists = true;
                                }
                                // this.clearCell(x, y);
                                socket.emit("clearCell", { x: x, y: y });
                            } else if (!(CHORDING.isSPACE || CHORDING.isLRCLICK) && this.satisfyFlags(x, y)) {
                                this.clearCells(x, y, false);
                            } else this.deselectCells(x, y);
                            $("#face").attr("class", "facesmile");
                            break;
                        default:
                        // do nothing
                    }
                }
            })

            .on("mouseover", e => {
                let cell = $(e.target);
                if (cell.hasClass("cell")) {
                    this.hoverCell = cell;
                    [this.hoverX, this.hoverY] = this.getCellFromID(this.hoverCell.attr("id"));
                    e.preventDefault();
                    if (e.buttons === 3 && this.cellIsClear(cell) && CHORDING.isLRCLICK) {
                        this.selectCells(this.hoverX, this.hoverY);
                        $("#face").attr("class", "faceooh");
                        return;
                    }
                    switch (e.buttons) {
                        case KEYCODE.LEFT_CLICK:
                            if (cell.hasClass("blank")) {
                                this.selectCell(this.hoverX, this.hoverY);
                                $("#face").attr("class", "faceooh");
                            } else if (!(CHORDING.isSPACE || CHORDING.isLRCLICK) && this.cellIsClear(cell)) {
                                this.selectCells(this.hoverX, this.hoverY);
                                $("#face").attr("class", "faceooh");
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
                    this.hoverCell = null;
                    this.hoverX, this.hoverY = null;
                }
            })

            .on("mouseout", e => {
                e.preventDefault();
                let cell = $(e.target);
                if (cell.hasClass("cell")) {
                    let [x, y] = this.getCellFromID(cell.attr("id"));
                    this.deselectCells(x, y);
                    $("#face").attr("class", "facesmile");
                }
            });

        $("#face")
            .on("mousedown", e => {
                switch (e.buttons) {
                    case 1:
                        $("#face").attr("class", "facepressed");
                        break;
                }
            })
            .on("mouseover", e => {
                switch (e.buttons) {
                    case 1:
                        $("#face").attr("class", "facepressed");
                        break;
                }
            });
        this.setFace("facesmile");
    }
    createKeyboardEvents() {
        $(document.body).unbind("keypress").on("keypress", e => {
            if (e.which === KEYCODE.SPACE && e.target == document.body) {
                // check SPACE
                e.preventDefault();
                if (this.hoverCell && this.hoverCell.hasClass("cell")) {
                    this.flagAndClear(this.hoverX, this.hoverY, !(CHORDING.isLCLICK || CHORDING.isLRCLICK));
                }
            } else if (this.HOST && e.which === KEYCODE.BACKTICK && e.target == document.body) {
                // check BACKTICK
                e.preventDefault();
                this.startGame();
            }
        });
    }
    // count flags in order to clear area
    satisfyFlags(x, y) {
        let flags = 0;
        this.do3x3Operation(x, y, (thisX, thisY, thisCell) => {
            if (thisCell.hasClass("bombflagged")) flags++;
        });
        return this.cellIsClear(this.getCanvasCell(x, y)) && this.getCanvasCell(x, y).hasClass("open" + flags);
    }
    clearCells(x, y) { /* removed overrideFlags */
        // this.do3x3Operation(x, y, (thisX, thisY, thisCell) => {
        //     if (!this.cellIsClear(thisCell) && (thisCell.hasClass("blank") || thisCell.hasClass("selected"))) socket.emit("clearCell", { x: thisX, y: thisY });
        // });
        socket.emit("clearCells", { x, y });
    }
    cellIsClear(cell) {
        return cell.attr("class").includes("open");
    }
    flagAndClear(x, y, clearCondition) {
        let cell = this.getCanvasCell(x, y);
        if (cell.hasClass("blank")) {
            // if cell blank, add flag
            socket.emit("addFlag", { x, y });
        } else if (cell.hasClass("bombflagged")) {
            // if flag, revert to blank
            socket.emit("removeFlag", { x, y });
        } else if (clearCondition && this.satisfyFlags(x, y)) {
            // if left click is on, clear cells
            socket.emit("clearCells", { x, y });
            this.clearCells(x, y);
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
        this.do3x3Operation(x, y, (thisX, thisY, cell) => {
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
        this.do3x3Operation(x, y, (thisX, thisY, cell) => {
            this.deselectCell(thisX, thisY);
        });
    }
    do3x3Operation(x, y, func) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
            for (let nx = x - 1; nx <= x + 1; nx++) {
                let cell = this.getCanvasCell(nx, ny);
                if (cell.length) func(nx, ny, cell);
            }
        }
    }
    updateFlagCounter() {
        let flagString = "" + limitNumber(this.FLAGS, -99, 999);
        while (flagString.length < 3) {
            if (+flagString < 0) {
                flagString = "-0" + -+flagString;
                break;
            }
            flagString = "0" + flagString;
        }
        $("#mines_ones").attr("class", "time" + flagString[2]);
        $("#mines_tens").attr("class", "time" + flagString[1]);
        $("#mines_hundreds").attr("class", "time" + flagString[0]);
    }
    updateTimer(time) {
        let timeString = "" + limitNumber(time, 0, 999);
        while (timeString.length < 3) {
            timeString = "0" + timeString;
        }
        $("#seconds_ones").attr("class", "time" + timeString[2]);
        $("#seconds_tens").attr("class", "time" + timeString[1]);
        $("#seconds_hundreds").attr("class", "time" + timeString[0]);
    }
    setFace(type) {
        let f = () => $("#face").attr("class", type);
        if (!this.SPECTATING) {
            $("#face")
                .attr("class", type)
                .off("mouseout mouseup")
                .on("mouseout mouseup", f)
            if (this.HOST) {
                $("#face").on("mouseup", () => this.startGame());
            }
        } else {
            f();
        }
    }
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function limitNumber(val, min, max) {
    if (val < min) return min;
    else if (val > max) return max;
    else return Math.round(val);
}

function limitInput(input, min, max) {
    input.val(limitNumber(+input.val(), min, max));
}