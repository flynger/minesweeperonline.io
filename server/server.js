// libraries
const bodyParser = require("./node_modules/body-parser");
const cors = require("./node_modules/cors");
const color = require("./libs/color");
const cookieParser = require("./node_modules/cookie-parser");
const express = require("./node_modules/express/index");
const jsonfile = require("./node_modules/jsonfile");
const sessions = require("./node_modules/express-session");
const socket = require("./node_modules/socket.io/dist/index");
const { uniqueNamesGenerator, adjectives, /*colors,*/ animals } = require("./node_modules/unique-names-generator");
require('locus');

// server setup
var app = express();
var port = 3000;
var name = "Minesweeper Online";
var sessionMiddleware = sessions({
    secret: "e'eF?infFwa%%ofFia*Gesj8\\g4pdO!ih",
    saveUninitialized: true,
    cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
    resave: false
});

app.use(express.static("../public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    cors({
        origin: "*",
    })
);
app.use(sessionMiddleware);

// url masks
app.get("/", (req, res) => {
    res.redirect("/play");
});
app.get("/home", (req, res) => {
    res.redirect("/play");
});
app.get("/play", (req, res) => {
    res.sendFile('play.html', { root: '../public' });
    // console.log(req.sessionID);
});
app.get("/spectate", (req, res) => {
    let requestedUsername = req.query.name.toLowerCase();
    // check if the requested user is currently playing
    //to be implemented: hasPlayer and getPlayer
    if (server.players.hasOwnProperty(requestedUsername)) {
        console.log({ requestedUsername });
        res.sendFile('play.html', { root: '../public' });
    } else res.redirect("/play");
});
app.post("/spectate", (req, res) => {
    let requestedUsername = req.query.name.toLowerCase();
    // console.log(req.session.username);
    // console.log(req.sessionID);
    // check if the requested user is currently playing
    //to be implemented: hasPlayer and getPlayer
    if (server.players.hasOwnProperty(requestedUsername) && server.players[requestedUsername].connected) {
        res.send({ success: true, username: requestedUsername });
    } else if (!server.players.hasOwnProperty(requestedUsername)) {
        res.send({ success: false, reason: "A player with the requested username does not exist." });
    } else {
        res.send({ success: false, reason: server.players[requestedUsername].displayName + " is not online!" });
    }
});
app.get("/profile", (req, res) => {
    res.sendFile('profile.html', { root: '../public' });
});
app.get("/settings", (req, res) => {
    res.sendFile('settings.html', { root: '../public' });
});
app.get("/login", (req, res) => {
    if (!req.session.username) {
        res.sendFile('login.html', { root: '../public' });
    }
    else res.redirect("/play");
});
app.post("/login", (req, res) => {
    // console.log(req.body);
    // console.log(req.session);
    // let username = req.body.username;
    // let password = req.body.password;
    res.send(loginHandler.loginAccount(req));
});
app.get("/register", (req, res) => {
    if (!req.session.username) {
        res.sendFile('register.html', { root: '../public' });
    }
    else res.redirect("/play");
});
app.post("/register", (req, res) => {
    // let username = req.body.username;
    // let password = req.body.password;
    res.send(loginHandler.registerAccount(req));
});

var expressServer = app.listen(port, () => console.log(color.blue, `Starting Server: ${name} on port ${port}`));
var io = socket(expressServer, {
    pingInterval: 900,
    pingTimeout: 5000
});
io.use((socket, next) => sessionMiddleware(socket.request, {}, next)); // gives request 

// our source files
var server = {
    io: io,
    onlinePlayers: []
}
var Minesweeper = require("./src/gameHandler")(server);
var chatHandler = require("./src/chatHandler")(server);
var loginHandler = require("./src/loginHandler")(server);
// var playerHandler = require("./src/playerHandler")(server);

io.on("connection", (socket) => {
    let { session, sessionID } = socket.request;
    let username = socket.username = session.username;
    if (!session.username) {
        session.isGuest = true;
        let displayName = "Guest " + uniqueNamesGenerator({
            dictionaries: [adjectives, animals],
            separator: " ",
            style: "capital"
        }); // big_red_donkey
        socket.username = username = session.username = displayName.toLowerCase();//sessionID;
        server.players[username] = { username, displayName, wins: 0, losses: 0, gamesCreated: 0, isGuest: true, connected: true };
    }
    server.players[username].connected = true;
    server.players[username].socket = session.socket = socket;
    server.players[username].board = null;
    server.onlinePlayers.push(server.players[username].displayName);

    // connect event
    console.log(color.green, socket.id);
    // console.log(Object.keys(server.players));
    // console.log(session);
    // chatHandler.joinSocketToRoom(socket, "global");
    // chatHandler.joinSocketToRoom(socket, "room");

    // add events
    socket.on("ping", (callback) => {
        callback();
    });

    // game events
    socket.on("createBoard", (settings) => {
        // if (req.session.username !== req.params.username) {
        //     return;
        // }
        // if board exists, delete it
        if (server.players[username].board != null) {
            server.players[username].board.reset();
            server.players[username].board = null;
        }
        let players = [username, ...server.players[username].coopPlayers];
        let spectators = [];
        for (let p of players) {
            let player = server.players[p];
            if (player.spectatorSockets) {
                for (let spectatorSocket of player.spectatorSockets) {
                    spectators.push(spectatorSocket);
                }
                // spectators.push(...player.spectatorSockets);
            }
        }
        let board = server.players[username].board = new Minesweeper.Board(settings, players, spectators);
        board.clearQueue();
        board.startTimer();
        //socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
        for (let player of board.PLAYERS) {
            let playerSocket = board.PLAYERS[player].socket;
            server.players[player].board = board;
            playerSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN, settings: board.SETTINGS, startPlaying: playerSocket != socket });
        }
        for (let spectatorSocket of board.SPECTATORS) {
            spectatorSocket.spectateBoard = board;
            spectatorSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN, settings: board.SETTINGS, startSpectating: true, time: 0 });
        }
        if (board.GAMEOVER) {
            board.reset(true);
            server.players[username].board = null;
        }
    });

    socket.on("resetBoard", () => {
        let board = server.players[username].board;
        if (board != null) {
            for (let spectatorSocket of board.SPECTATORS) {
                delete spectatorSocket.spectateBoard;
                spectatorSocket.emit("boardData", { gameOver: false, startSpectating: true, time: 0, settings: board.SETTINGS });
            }
            board.reset();
            erver.players[username].board = null;
        }
    });

    socket.on("clearCell", (data) => {
        let board = server.players[username].board;
        if (board != null) {
            let { x, y } = data;
            if (board.checkCell(x, y, ["?"])) {
                board.clearCell(x, y, socket.username);
                board.clearQueue();
                board.TIMESTAMPS.push({ time: Date.now() - board.START_TIME, x, y, board: JSON.stringify(board.CLEARED) });
                socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                for (let spectatorSocket of board.SPECTATORS) {
                    spectatorSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                }
                if (board.GAMEOVER) {
                    board.reset(true);
                    server.players[username].board = null;
                }
            }
        }
    });

    socket.on("clearCells", (data) => {
        let board = server.players[username].board;
        if (board != null) {
            let { x, y } = data;
            if (x < board.WIDTH && y < board.HEIGHT && board.satisfyFlags(x, y)) {
                // console.log("clearing cells around cell:", data);
                for (let v = -1; v <= 1; v++) {
                    for (let h = -1; h <= 1; h++) {
                        if (board.checkCell(x + h, y + v, ["?"])) { // space does weird stuff !!! check
                            board.CLEARQUEUE.push([x + h, y + v]);
                            board.CLEARED[y + v][x + h] = "Q";
                        }
                    }
                }
                board.clearQueue();
                board.TIMESTAMPS.push({ time: Date.now() - board.START_TIME, x, y, board: JSON.stringify(board.CLEARED) });
                socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                for (let spectatorSocket of board.SPECTATORS) {
                    spectatorSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                }
                if (board.GAMEOVER) {
                    board.reset(true);
                    server.players[username].board = null;
                }
            }
        }
    });

    socket.on("addFlag", (data) => {
        let board = server.players[username].board;
        if (board != null) {
            let { x, y } = data;
            if (board.flagCell(x, y)) {
                board.TIMESTAMPS.push({ time: Date.now() - board.START_TIME, x, y, board: JSON.stringify(board.CLEARED) });
                socket.emit("boardData", { board: board.CLEARED });
                for (let spectatorSocket of board.SPECTATORS) {
                    spectatorSocket.emit("boardData", { board: board.CLEARED });
                }
            }
        }
    });

    socket.on("removeFlag", (data) => {
        let board = server.players[username].board;
        if (board != null) {
            let { x, y } = data;
            if (board.unflagCell(x, y)) {
                board.TIMESTAMPS.push({ time: Date.now() - board.START_TIME, x, y, board: JSON.stringify(board.CLEARED) });
                socket.emit("boardData", { board: board.CLEARED });
                for (let spectatorSocket of board.SPECTATORS) {
                    spectatorSocket.emit("boardData", { board: board.CLEARED });
                }
            }
        }
    });

    // socket.on("spectate", (username) => {
    //     console.log("Emitting spectate data");
    //     let player = server.players[username];
    //     socket.emit("boardData", { board: player.board.CLEARED, gameOver: player.board.GAMEOVER, win: player.board.WIN });
    // });

    socket.on("startSpectating", (data) => {
        let playerToSpectate = socket.playerToSpectate = server.players[data.name];
        if (!playerToSpectate.spectatorSockets) playerToSpectate.spectatorSockets = [];
        playerToSpectate.spectatorSockets.push(socket);
        if (playerToSpectate.board) {
            let currentGame = socket.spectateBoard = playerToSpectate.board;
            currentGame.SPECTATORS.push(socket);
            socket.emit("boardData", { board: currentGame.CLEARED, gameOver: currentGame.GAMEOVER, startSpectating: true, time: currentGame.TIME, settings: currentGame.SETTINGS }); // send the current board data to the client
        } else socket.emit("boardData", { startSpectating: true, time: 0, settings: { width: 30, height: 16, mines: 99 } });
    });

    socket.on("startCoop", (data) => {
        let hostPlayer = socket.hostPlayer = server.players[data.name];
        if (!hostPlayer.coopSockets) hostPlayer.coopSockets = [];
        hostPlayer.coopSockets.push(socket);
        if (hostPlayer.board) {
            let currentGame = server.players[username].board = hostPlayer.board;
            currentGame.PLAYERS.push(username);
            socket.emit("boardData", { board: currentGame.CLEARED, gameOver: currentGame.GAMEOVER, startPlaying: true, time: currentGame.TIME, settings: currentGame.SETTINGS }); // send the current board data to the client
        } else socket.emit("boardData", { startSpectating: true, time: 0, settings: { width: 30, height: 16, mines: 99 } });
    });


    // chat and room events
    socket.on("joinRoom", (data) => {
        let result = chatHandler.joinSocketToRoom(socket, data.requestedRoom);
        if (result.error) {
            socket.emit("roomJoinFailure", { room: data.requestedRoom, error: result.error });
        } else if (result.success) {
            socket.emit("roomJoinSuccess", { room: data.requestedRoom, messages: [`You connected as user: ${server.players[username].displayName}`, "Joined chat: " + data.requestedRoom] });
        }
    });

    socket.on("chatMessage", (data) => {
        // console.log(color.yellow, socket.id);
        chatHandler.processChat(socket, data)
    });

    // add disconnect event
    socket.on("disconnect", () => {
        console.log(color.red, socket.id);
        // if board exists, delete it
        let board = server.players[username].board;
        if (board != null) {
            board.reset();
            server.players[username].board = null;
            console.log(color.red, "Deleted board for disconnected player " + username);
        }
        if (socket.spectateBoard) {
            let spectateBoard = socket.spectateBoard;
            spectateBoard.SPECTATORS.splice(spectateBoard.SPECTATORS.indexOf(socket), 1);
            console.log(color.red, "Stopped spectating board for disconnected player " + server.players[username].displayName);
        }
        if (socket.playerToSpectate) {
            socket.playerToSpectate.spectatorSockets.splice(socket.playerToSpectate.spectatorSockets.indexOf(socket), 1);
        }
        delete session.socket;
        if (session.isGuest) {
            delete server.players[username];
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
    loginHandler.saveData();
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