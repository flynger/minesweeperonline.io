var latency = -1;
var link = window.location.href;
var socket = io.connect(link);

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
        alert(data.requestedRoom);
        addServerMessage("Something went wrong with joining that room.", currentChat.id);
    }
});

socket.on("roomJoinFailure", (data) => {
    alert(data);
    if (data.room === requestedRoom.id) {
        addServerMessage(data.error, currentChat.id);
        requestedRoom = false;
    }
});

socket.on("boardData", (data) => {
    console.log(data.board);
    for (let row in minesweeper.GRID) {
        for (let col in minesweeper.GRID[row]) {
            if (minesweeper.GRID[row][col] != data.board[row][col]) {
                let classToAdd = "";
                switch (data.board[row][col]) {
                    case "?":
                        // uncleared
                        classToAdd = -1;
                        break
                    case "F":
                        // flag
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
                        $("#game").off();
                        break
                    default:
                        classToAdd = "open" + data.board[row][col];
                }
                if (classToAdd != -1) {
                    $(`#${row}_${col}`).attr("class", "cell " + classToAdd);
                }
            }
        }
        //minesweeper.GRID = data.board;
    }
});

socket.on("boardTime", (data) => {
    minesweeper.updateTimer(data.time);
});
// socket.on("joinROom", (data) => {
//     addChatMessage(data.user + " successfully joined " + data.room)
// })
