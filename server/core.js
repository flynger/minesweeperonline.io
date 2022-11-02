// shorthands
var server = require("./libs/server");
var color = require("./libs/server");

const jsonfile = require("./libs/node_modules/jsonfile");
const fs = require("./libs/node_modules/graceful-fs/graceful-fs");
server.init(3000, "Minesweeper Online");

const filters = require("./filters");

// login events
server.on("login", (data) => {
    
});

server.on("signUp", (data) => {
    
});

// input events
server.on("playerInput", (id) => {
    server.emit(id, {msg: "you're bad"}, "alertMessage");    
});

server.on("chatMessage", (data) => {
    console.log("chat receive")
    if (filterMessage(data)) {
        server.send({ user: "anon" + data.id.substring(0, 4), msg: data.msg },"chatMessage")
    }
});

server.on("Alert", (data) => {
    
});


// connection events
server.onConnect = (socket) => {
    console.log(socket.id + " connected!");
    socket.emit("onConnect", { id: socket.id });
}

server.onDisconnect = (socket) => {
    
}

// server end
process.on('exit', (code) => {

});

// local functions
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function filterMessage(data) {
    // if msg too long return false (dont send it to other users)
    if (data.msg.length > 50) {
        server.emit(data.id, { user: "Server", msg: `Your message is longer than 50 characters. (${data.msg.length} characters)`}, "chatMessage");
        return false;
    }

    // else return true (send it to other users)
    for (let i of filters) {
        if (data.msg.toLowerCase().includes(i)) {
            data.msg = data.msg.replace(new RegExp(i, "gi"), "*".repeat(i.length));
        }
    }
    data.msg = data.msg.replace(/<\/?[^>]+(>|$)/g, "");
    return true;
}