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
    let requestedUsername = req.query.name ? req.query.name.toLowerCase() : req.session.username ? req.session.username : "";
    if (requestedUsername && server.players.hasOwnProperty(requestedUsername)) {
        res.sendFile('profile.html', { root: '../public' });
    } else res.redirect("/login");
});
app.post("/profile", (req, res) => {
    let requestedUsername = req.query.name ? req.query.name.toLowerCase() : req.session.username ? req.session.username : "";
    if (requestedUsername && server.players.hasOwnProperty(requestedUsername)) {
        let { username, displayName, wins, losses, gamesCreated, connected } = server.players[requestedUsername];
        res.send({ success: true, data: { username, displayName, wins, losses, gamesCreated, connected } });
    } else {
        res.send({ success: false });
    }
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
    res.send(loginHandler.loginAccount(req, res));
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
    res.send(loginHandler.registerAccount(req, res));
});
app.get("/logout", (req, res) => {
    if (req.session.username) {
        res.clearCookie("signedIn");
        delete req.session.username;
        delete req.session.isGuest;
    }
    res.redirect("/login");
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

setInterval(() => {
    console.log("sending global players list");
    io.emit("playersOnline", server.onlinePlayers);
}, 5000);

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
    if (!server.players[username].hasOwnProperty("spectatorSockets")) server.players[username].spectatorSockets = [];
    if (!server.players[username].hasOwnProperty("coopPlayers")) server.players[username].coopPlayers = [];
    if (!server.players[username].hasOwnProperty("coopRequests")) server.players[username].coopRequests = [];
    server.onlinePlayers.push(server.players[username].displayName);
    console.log(server.onlinePlayers);

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
        if (!socket.hasOwnProperty("hostPlayer")) {
            if (settings.width > 50 || settings.height > 100) {
                return;
            }
            // if board exists, delete it
            if (server.players[username].board != null) {
                server.players[username].board.reset();
                server.players[username].board = null;
            }
            let players = [username, ...server.players[username].coopPlayers];
            let spectators = [];
            for (let p of players) {
                let player = server.players[p];
                player.gamesCreated++;
                if (player.spectatorSockets) {
                    for (let spectatorSocket of player.spectatorSockets) {
                        spectators.push(spectatorSocket);
                    }
                    // spectators.push(...player.spectatorSockets);
                }
            }
            console.log("starting game with players: " + players);
            console.log("spectators: " + spectators.map(socket => socket.username));
            let board = server.players[username].board = new Minesweeper.Board(settings, players, spectators);
            board.clearQueue();
            board.startTimer();
            //socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
            for (let player of board.PLAYERS) {
                let playerSocket = server.players[player].socket;
                server.players[player].board = board;
                playerSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN, settings: board.SETTINGS, startPlaying: playerSocket != socket, time: 0 });
            }
            for (let spectatorSocket of board.SPECTATORS) {
                spectatorSocket.spectateBoard = board;
                spectatorSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN, settings: board.SETTINGS, startSpectating: true, time: 0 });
            }
            if (board.GAMEOVER) {
                console.log("game over createBoard", color.red);
                board.reset(true);
                server.players[username].board = null;
            }
        }
    });

    socket.on("resetBoard", () => {
        if (!socket.hasOwnProperty("hostPlayer")) {
            let board = server.players[username].board;
            if (board != null) {
                for (let player of board.PLAYERS) {
                    let playerSocket = server.players[player].socket;
                    if (playerSocket != socket) {
                        server.players[player].board = null;
                        playerSocket.emit("boardData", { gameOver: false, startSpectating: true, time: 0, settings: board.SETTINGS });
                    }
                }
                for (let spectatorSocket of board.SPECTATORS) {
                    delete spectatorSocket.spectateBoard;
                    spectatorSocket.emit("boardData", { gameOver: false, startSpectating: true, time: 0, settings: board.SETTINGS });
                }
                console.log("game over: resetBoard", color.red);
                board.reset();
                server.players[username].board = null;
            }
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
                // socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                for (let player of board.PLAYERS) {
                    let playerSocket = server.players[player].socket;
                    playerSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                }
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
                //socket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                for (let player of board.PLAYERS) {
                    let playerSocket = server.players[player].socket;
                    playerSocket.emit("boardData", { board: board.CLEARED, gameOver: board.GAMEOVER, win: board.WIN });
                }
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
                // socket.emit("boardData", { board: board.CLEARED });
                for (let player of board.PLAYERS) {
                    let playerSocket = server.players[player].socket;
                    playerSocket.emit("boardData", { board: board.CLEARED });
                }
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
                // socket.emit("boardData", { board: board.CLEARED });
                for (let player of board.PLAYERS) {
                    let playerSocket = server.players[player].socket;
                    playerSocket.emit("boardData", { board: board.CLEARED });
                }
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
        playerToSpectate.spectatorSockets.push(socket);
        if (playerToSpectate.board) {
            let currentGame = socket.spectateBoard = playerToSpectate.board;
            currentGame.SPECTATORS.push(socket);
            socket.emit("boardData", { board: currentGame.CLEARED, gameOver: currentGame.GAMEOVER, startSpectating: true, time: currentGame.TIME, settings: currentGame.SETTINGS }); // send the current board data to the client
        } else socket.emit("boardData", { startSpectating: true, time: 0, settings: { width: 30, height: 16, mines: 99 } });
    });

    socket.on("requestCoop", (data) => {
        let requestedPlayer = server.players[data.name];
        if (server.players.hasOwnProperty(data.name) && requestedPlayer.connected) {
            if (!requestedPlayer.coopRequests.includes(username)) {
                console.log("added co-op request to " + data.name);
                requestedPlayer.coopRequests.push(username);
            }
            console.log("sent request packet to " + data.name);
            socket.emit("chatMessage", { user: "Server", msg: `Sent co-op request to ${server.players[data.name].displayName}` });
            requestedPlayer.socket.emit("requestCoop", { name: username, displayName: server.players[username].displayName });
        }
    });

    socket.on("startCoop", (data) => {
        console.log(username + " accepted co-op request");
        if (server.players[username].coopRequests.includes(data.name) && server.players[data.name].connected) {
            let board = server.players[username].board;
            if (board != null) {
                board.reset();
                server.players[username].board = null;
                console.log(color.red, "Deleted board for coop player " + username);
            }
            let hostPlayer = socket.hostPlayer = server.players[data.name];
            hostPlayer.coopPlayers.push(username);
            server.players[username].coopRequests.splice(server.players[username].coopRequests.indexOf(data.name), 1);
            if (hostPlayer.board) {
                let currentGame = server.players[username].board = hostPlayer.board;
                currentGame.PLAYERS.push(username);
                socket.emit("boardData", { board: currentGame.CLEARED, gameOver: currentGame.GAMEOVER, startPlaying: true, time: currentGame.TIME, settings: currentGame.SETTINGS }); // send the current board data to the client
            } else socket.emit("boardData", { startSpectating: true, time: 0, settings: { width: 30, height: 16, mines: 99 } });
        }
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
        server.players[username].connected = false;
        // if board exists, delete it
        let board = server.players[username].board;
        if (!socket.hasOwnProperty("hostPlayer") && board != null) {
            board.reset();
            for (let player of board.PLAYERS) {
                if (server.players.hasOwnProperty(player) && player !== username) {
                    server.players[player].socket.emit("boardData", { startSpectating: true, time: 0, settings: board.SETTINGS });
                    server.players[player].board = null;
                }
            }
            server.players[username].board = null;
            console.log(color.red, "Deleted board for disconnected player " + username);
        } else if (socket.hasOwnProperty("hostPlayer")) {
            socket.hostPlayer.coopPlayers.splice(socket.hostPlayer.coopPlayers.indexOf(username), 1);
            // console.log("coopPlayers: " + socket.hostPlayer.coopPlayers);
            if (board != null) {
                board.PLAYERS.splice(board.PLAYERS.indexOf(username), 1);
                // console.log("board players: " + board.PLAYERS);
            }
        }
        if (socket.spectateBoard) {
            let spectateBoard = socket.spectateBoard;
            spectateBoard.SPECTATORS.splice(spectateBoard.SPECTATORS.indexOf(socket), 1);
            console.log(color.red, "Stopped spectating board for disconnected player " + server.players[username].displayName);
        }
        if (socket.playerToSpectate) {
            socket.playerToSpectate.spectatorSockets.splice(socket.playerToSpectate.spectatorSockets.indexOf(socket), 1);
        }

        server.onlinePlayers.splice(server.onlinePlayers.indexOf(server.players[username].displayName), 1);
        console.log(server.onlinePlayers);
        delete session.socket;
        if (session.isGuest) {
            delete server.players[username];
        }
    });
    // send username
    socket.emit("username", username);
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