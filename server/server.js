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
var Minesweeper = require("./src/gameHandler")(server);
var chatHandler = require("./src/chatHandler")(server);
var loginHandler = require("./src/loginHandler")(server);

io.on("connection", (socket) => {
    // connect event
    console.log(color.green, socket.id);
    // chatHandler.joinSocketToRoom(socket, "global");
    // chatHandler.joinSocketToRoom(socket, "room");

    // add events
    socket.on("ping", (callback) => {
        callback();
    });

    // login events
    socket.on("login", (data) => {
        console.log(`received login: ${JSON.stringify(data)}`);
        loginHandler.loginAccount(socket, data);
    });

    socket.on("register", (data) => {
        console.log(`received signup: ${JSON.stringify(data)}`);
        loginHandler.registerAccount(socket, data);
    });

    // game events
    socket.on("createBoard", (settings) => {
        // if board exists, delete it
        if (Minesweeper.hasBoard(socket)) {
            Minesweeper.resetBoard(socket);
        }
        let board = Minesweeper.createBoard(socket, settings);
        board.clearQueue();
        socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER });
        if (board.GAMEOVER) {
            let timeElapsed = Date.now() - board.START_TIME;
            console.log(timeElapsed);
            
            Minesweeper.resetBoard(socket);
        }
        else board.timer = setInterval(() => {
            board.TIME++;
            socket.emit("boardTime", { time: board.TIME });
        }, 1000);
    });

    socket.on("resetBoard", () => {
        if (Minesweeper.hasBoard(socket)) {
            Minesweeper.resetBoard(socket);
        }
    });

    socket.on("clearCell", (data) => {
        if (Minesweeper.hasBoard(socket) && Minesweeper.getBoard(socket).checkCell(data.x, data.y, ["?"])) {
            let board = Minesweeper.getBoard(socket);
            board.clearCell(data.x, data.y);
            board.clearQueue();
            socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER });
            if (board.GAMEOVER) {
                console.log(Date.now() - board.START_TIME);
                Minesweeper.resetBoard(socket);
            }
        }
    });

    // chat and room events
    socket.on("joinRoom", (data) => {
        let result = chatHandler.joinSocketToRoom(socket, data.requestedRoom);
        if (result.error) {
            socket.emit("roomJoinFailure", { room: data.requestedRoom, error: result.error });
        } else if (result.success) {
            socket.emit("roomJoinSuccess", { room: data.requestedRoom });
        }
    });

    socket.on("chatMessage", (data) => chatHandler.processChat(socket, data));

    // add disconnect event
    socket.on("disconnect", () => {
        console.log(color.red, socket.id);
        // reference to player exists, delete it
        if (Minesweeper.socketToPlayer[socket.id] !== undefined) {
            delete gameHandler.socketToPlayer[socket.id];
        }
        // if board exists, delete it
        if (Minesweeper.hasBoard(socket)) {
            Minesweeper.resetBoard(socket);
            console.log(color.red, "Deleted board for disconnected player");
        }
    });
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