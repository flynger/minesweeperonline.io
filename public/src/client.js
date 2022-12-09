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
        addServerMessage(`You connected as user: Guest ${socket.id.substring(0, 4)}`, currentChat.id);
        addServerMessage("Joined chat: " + requestedRoom.displayName, requestedRoom.id);
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
                        // uncleared
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
                        if (!death) death = true;
                        break
                    case "FX":
                        classToAdd = "bombmisflagged";
                        break
                    case "RX":
                        classToAdd = "bombdeath";
                        if (!death) death = true;
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
    if (death) {
        $("#game").off();
        minesweeper.setFace("facedead");
    } else if (data.board.every((row) => row.every(val => val != "?" && val != "X" && val != "X" && val != "X"))) {
        $("#game").off();
        minesweeper.setFace("facewin");
    }
});

socket.on("boardTime", (data) => {
    minesweeper.updateTimer(data.time);
});
