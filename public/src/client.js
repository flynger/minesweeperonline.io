var latency = -1;
var username;

setInterval(() => {
    const start = Date.now();

    socket.emit("ping", () => {
        const duration = Date.now() - start;
        latency = duration;
    });
}, 1000);

socket.on("username", (name) => {
    // connect event
    username = name;
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
        // console.log(data);
        minesweeper.SETTINGS = data.settings;
        minesweeper.startGame(true, false);
        minesweeper.updateTimer(data.time);
        if (!data.board) {
            return;
        }
    } else if (data.startPlaying) {
        // console.log(data);
        minesweeper.SETTINGS = data.settings;
        minesweeper.startGame(false, false);
        minesweeper.updateTimer(data.time);
        if (!data.board) {
            return;
        }
    }
    for (let row in minesweeper.GRID) {
        for (let col in minesweeper.GRID[row]) {
            if (minesweeper.GRID[row][col] != data.board[row][col]) {
                let classToAdd = "";
                let value = data.board[row][col];
                if (minesweeper.GRID[row][col] === "F") {
                    minesweeper.FLAGS++;
                }
                switch (value) {
                    case "?":
                        // uncleared or dont do anything
                        classToAdd = "blank";
                        break
                    case "F":
                        // flag
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
                        classToAdd = "open" + value;
                }
                minesweeper.GRID[row][col] = value;
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

socket.on("gameStats", (data) => {
    minesweeper.updateTimer(Math.floor(data.time));
    $("#player-name").html("Player" + (data.players.length > 1 ? "s" : "") + ": " + data.players.join(", "));
    if (data.spectators.length > 0) {
        $("#spectator-name").html("Spectator" + (data.spectators.length == 1 ? "" : "s") + ": " + data.spectators.join(", "));
    }
    $("#time").html(data.time);
    $("#result").html(data.result);
    $("#result-block")[0].style.display = "inline-flex";
});

socket.on("requestCoop", (data) => {
    addServerMessage("Received co-op request from " + data.displayName, currentChat.id);

    $("#dialog-text").html(`You have been invited to play together by ${data.displayName}. Accept the request?`);
    $("#dialog-confirm").dialog({
        title: "Co-op request from " + data.displayName,
        resizable: false,
        draggable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Accept request": function () {
                $(this).dialog("close");
                socket.emit("startCoop", data);
            },
            "Ignore": function () {
                $(this).dialog("close");
            }
        }
    });
});

socket.on("coopJoined", (data) => {
    addServerMessage(data.displayName + " join the co-op!", currentChat.id);

    $("#dialog-text").html(`${data.displayName} accepted the co-op request and joined the co-op.`);
    $("#dialog-confirm").dialog({
        title: "Co-op request to " + data.displayName,
        resizable: false,
        draggable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Ok": function () {
                $(this).dialog("close");
            }
        }
    });
});

socket.on("coopOnHold", (data) => {
    addServerMessage(data.displayName + " went offline", currentChat.id);

    $("#dialog-text").html(`${data.displayName} disconnected and went offline. You can continue waiting until they rejoin.`);
    $("#dialog-confirm").dialog({
        title: data.displayName + " is offline",
        resizable: false,
        draggable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Ok": function () {
                $(this).dialog("close");
            }
        }
    });
});

socket.on("coopLeft", (data) => {
    addServerMessage(data.displayName + " left the co-op", currentChat.id);

    $("#dialog-text").html(`${data.displayName} disconnected and left the co-op.`);
    $("#dialog-confirm").dialog({
        title: data.displayName + " left",
        resizable: false,
        draggable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Ok": function () {
                $(this).dialog("close");
            }
        }
    });
});

socket.on("playersOnline", (onlinePlayers) => {
    onlinePlayers = onlinePlayers.sort();
    $("#users-list").html("");
    let text = "";
    for (let player of onlinePlayers) {
        if (player.toLowerCase() != username) {
            text += "<tr><td>" + player + "&nbsp; <button onclick='window.location.href=" + '"/spectate?name=' + player + '"' + "'>Spectate</button>&nbsp; <button onclick='inviteToGame(\"" + player.toLowerCase() + "\"); $(this).prop(\"disabled\", true);'>Invite</button> &nbsp;<a href='/profile?name=" + player.toLowerCase() +"'>Profile</a></td>";
        }
        else text += "<tr><td>" + player + " (You)</td>";
    }
    $("#users-list").html(text);
});