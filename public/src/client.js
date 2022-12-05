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

// socket.on("joinROom", (data) => {
//     addChatMessage(data.user + " successfully joined " + data.room)
// })

