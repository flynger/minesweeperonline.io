// libraries
const express = require("./node_modules/express/index");
const socket = require("./node_modules/socket.io/dist/index");
const cors = require("./node_modules/cors");
const color = require("./libs/color");
const jsonfile = require("./node_modules/jsonfile");

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
app.get("/home", (req, res) => {
    res.sendFile('index.html', { root: '../public' });
});
app.get("/profile", (req, res) => {
    res.sendFile('profile.html', { root: '../public' });
});
app.get("/settings", (req, res) => {
    res.sendFile('settings.html', { root: '../public' });
});
app.get("/login", (req, res) => {
    res.sendFile('login.html', { root: '../public' });
});
app.get("/register", (req, res) => {
    res.sendFile('register.html', { root: '../public' });
});

var expressServer = app.listen(port, () => console.log(color.blue, `Starting Server: ${name} on port ${port}`));
var io = socket(expressServer, {
    pingInterval: 900,
    pingTimeout: 5000
});

// our source files
var server = {
    io: io
}
var chatHandler = require("./src/chatHandler")(server);
var loginHandler = require("./src/loginHandler")(server);

io.on("connection", (socket) => {
    // connect event
    console.log(color.green, socket.id);
    socket.join("Global");
    socket.join("Room");

    // add events
    socket.on("ping", (callback) => {
        callback();
    });

    // login events
    socket.on("login", (data) => {

    });

    socket.on("register", data => {
        console.log(`received signup: ${JSON.stringify(data)}`);
        loginHandler.registerAccount(socket, data);
    });

    // input events
    socket.on("playerInput", (id) => {
        //socket.emit();
    });

    socket.on("joinRoom", data => {
        let room = data.room.toLowerCase();
        if (socket.rooms.has(room)) {
            socket.emit("chatMessage", { user: "Server", msg: "You're already in that room!" });
        } else if (room.length > 15) {
            socket.emit("chatMessage", { user: "Server", msg: `Your room name is longer than 15 characters. (${room.length} characters)` });
        } else {
            socket.join(room);
            socket.emit("chatMessage", { user: "Server", msg: ("Successfully joined room: " + data.room) });
        }
    });

    socket.on("chatMessage", data => chatHandler.processChat(socket, data));

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
process.on("SIGINT", () => process.exit(0));

process.on("exit", (code) => {
    console.log(`Process exited with code: ${code}`);
    loginHandler.saveAccountData()
    console.log("Account data saved successfully");
});

// helper functions
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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