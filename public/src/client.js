var latency = -1;

setInterval(() => {
    const start = Date.now();

    socket.emit("ping", () => {
        const duration = Date.now() - start;
        latency = duration;
    });
}, 1000);

socket.on("connect", (ms) => {
    // connect event
});

socket.on("pong", (ms) => {
    latency = ms;
});

socket.on("chatMessage", (data) => {
    if (data.user === "Server") {
        addServerMessage(data.msg, data.room);
    } else {
        addChatMessage(data.user, data.msg, data.room);
    }
});

socket.on("roomJoinSuccess", (data) => {
    if (data.room === requestedRoom.id) {
        chatRooms[requestedRoom.id] = requestedRoom;
        updateChatRooms();
        selectChat(requestedRoom);
        for (let message in data.messages) {
            addServerMessage(data.messages[message], currentChat.id);
        }
        requestedRoom = false;
    } else {
        addServerMessage("Something went wrong with joining that room.", currentChat.id);
    }
});

socket.on("roomJoinFailure", (data) => {
    if (data.room === requestedRoom.id) {
        addServerMessage(data.error, currentChat.id);
        requestedRoom = false;
    }
});

socket.on("boardData", (data) => {
    if (data.startSpectating) {
        minesweeper.startGame(true);
        minesweeper.updateTimer(data.time);
    }
    let win = true;
    let death = false;
    for (let row in minesweeper.GRID) {
        for (let col in minesweeper.GRID[row]) {
           if (minesweeper.GRID[row][col] != data.board[row][col]) {
                let classToAdd = "";
                let value =  data.board[row][col];
                if (minesweeper.GRID[row][col] === "F") {
                    if (data.gameOver) {
                        value = value === "X" ? "?" : "FX";
                    } else {
                        if (value !== "?") {
                            minesweeper.FLAGS++;
                        } else value = "?";
                    }
                }
                switch (value) {
                    case "?":
                        // uncleared or dont do anything
                        break
                    case "F":
                        // flag
                        minesweeper.GRID[row][col] = "F";
                        minesweeper.FLAGS--;
                        classToAdd = "bombflagged";
                        break
                    case "X":
                        // bomb (gameover)
                        classToAdd = "bombrevealed";
                        break
                    case "FX":
                        classToAdd = "bombmisflagged";
                        break
                    case "RX":
                        classToAdd = "bombdeath";
                        break
                    default:
                        minesweeper.GRID[row][col] = value;
                        classToAdd = "open" + value;
                }
                if (classToAdd) $(`#${row}_${col}`).attr("class", "cell " + classToAdd);
            }
        }
    }
    // scuffed win/loss code
    minesweeper.updateFlagCounter();
    if (data.gameOver) {
        $("#game").off();
        minesweeper.setFace("face" + (data.win ? "win" : "dead"));
    }
});

socket.on("boardTime", (data) => {
    minesweeper.updateTimer(data.time);
});

