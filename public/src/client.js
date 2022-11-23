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
    if (data.user == "Server") {
        addServerMessage(data.msg);
    }
    else addChatMessage(data.user, data.msg);
});