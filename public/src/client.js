var latency = -1;
var link = "localhost:3000"; //73.109.23.105
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
    if (data.user == "Server") {
        addServerMessage(data.msg);
    }
    else addChatMessage(data.user, data.msg);
});