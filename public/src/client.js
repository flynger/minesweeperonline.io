var latency = -1;
// var link = "73.109.23.105:3000"; //73.109.23.105
var link = "localhost:3000"
const socket = io.connect(link);

//buttons and inputs

setInterval(() => {
    const start = Date.now();

    socket.emit("ping", () => {
        const duration = Date.now() - start;
        latency = duration;
    });
}, 1000);

socket.on("connect", (ms) => {
    // connect event
    addServerMessage(`You connected with id: ${socket.id}`)
});

socket.on("pong", (ms) => {
    latency = ms;
});

socket.on("chatMessage", (data) => {
    if (data.user === "Server") {
        addServerMessage(data.msg);
    } else {
        addChatMessage(data.user, data.msg)
    }
});

// socket.on("joinROom", (data) => {
//     addChatMessage(data.user + " successfully joined " + data.room)
// })

