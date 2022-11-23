// libraries
const express = require("./node_modules/express/index");
const socket = require("./node_modules/socket.io/dist/index");
const cors = require("./node_modules/cors");
const color = require("./libs/color");
const filters = require("./libs/filters");
const jsonfile = require("./node_modules/jsonfile");
const fs = require("./node_modules/graceful-fs/graceful-fs");

// server setup
var app = express();
var port = 3000;
var name = "Minesweeper Online";
app.use(express.static("../public"));
app.use(
    cors({
        origin: "*",
    })
);

// url masks
app.get("/home", function (req, res) {
    res.sendFile('index.html', {root: '../public'});

});
app.get("/profile", function (req, res) {
    res.sendFile('profile.html', {root: '../public'});

});
app.get("/settings", function (req, res) {
    res.sendFile('settings.html', {root: '../public'});
});
app.get("/login", function (req, res) {
    res.sendFile('login.html', {root: '../public'});

});
app.get("/register", function (req, res) {
    res.sendFile('register.html', {root: '../public'});
});

var server = app.listen(port, () => console.log(color.blue, `Starting Server: ${name} on port ${port}`));
var io = socket(server, {
    pingInterval: 900,
    pingTimeout: 5000
});

io.on("connection", (socket) => {
    // connect event
    console.log(color.green, socket.id);
    socket.join("global");

    // add events
    socket.on("ping", (callback) => {
        callback();
    });

    // login events
    socket.on("login", (data) => {

    });

    socket.on("register", (data) => {
        console.log("registered : \n" + data.username + "\n" + data.password)
    });

    // input events
    socket.on("playerInput", (id) => {
        //socket.emit();
    });

    socket.on("joinRoom", (data) => {
        if (data.room.length > 15) {
            socket.emit("chatMessage", { user: "Server", msg: `Your room name is longer than 15 characters. (${data.room.length} characters)` });
        } else {
            socket.join(data.room);
            socket.emit("chatMessage", {user: "Server", msg: ("Successfully joined room: " + data.room)});
        }
    });

    socket.on("chatMessage", (data) => {
        console.log("Message received, Room: " + new Array(...socket.rooms));
        let message = filterMessage(data.msg);

        // if msg too long send an error back, else send it to all users
        if (message.length > 50) {
            socket.emit("chatMessage", { user: "Server", msg: `Your message is longer than 50 characters. (${message.length} characters)` });
        } else {
            io.to("global").emit("chatMessage", { user: "Guest " + socket.id.substring(0, 4), msg: message });
        }
    });

    //test
    socket.on('test', (number, string, obj) => {
        console.log(number, string, obj);
    })

    // add disconnect event
    socket.on("disconnect", () => console.log(color.red, socket.id));
});

/* to broadcast event to all users: io.sockets.emit(key, data);
   to broadcast event to a single socket (without reference): io.sockets.sockets.get(socketid).emit(key, data);
*/

// code run on server termination
process.on("exit", (code) => {

});

// helper functions
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function filterMessage(message) {
    for (let i of filters) {
        if (message.toLowerCase().includes(i)) {
            message = message.replace(new RegExp(i, "gi"), "*".repeat(i.length));
        }
    }
    return message.replace(/<\/?[^>]+(>|$)/g, "");
}

// var lst = [];
// server.on = (key, event) => {
//     lst.push({
//         key: key,
//         event: event
//     });
// }
// server.onConnect = (socket) => {}
// server.onDisconnect = (socket) => {}