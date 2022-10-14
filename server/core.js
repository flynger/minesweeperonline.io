// shorthands
var server = require("./libs/server");
var color = require("./libs/server");

const jsonfile = require("./libs/node_modules/jsonfile");
const fs = require("./libs/node_modules/graceful-fs/graceful-fs");
server.init(3000, "Minesweeper Online");

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