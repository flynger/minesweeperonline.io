const { json } = require("express");

module.exports = (server) => {
    const jsonfile = require("../node_modules/jsonfile");
    const accounts = jsonfile.readFileSync("./data/accounts.json");
    const playerData = jsonfile.readFileSync("./data/players.json");
    var { io } = server; // tells you what properties of server are imported
    let players = server.players = playerData;
    console.log(`accounts: ${JSON.stringify(accounts)}`);

    var loginHandler = {
        registerAccount: (req) => {
            let displayName = req.body.username;
            let username = displayName.toLowerCase();
            let password = req.body.password;
            if (accounts[username]) {
                return { success: false, reason: "An account with the provided username already exists." };
                //socket.emit("usernameExists");
            } else if (!/(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/.test(password)) {
                return { success: false, reason: "Invalid password. A password must include 1 lowercase letter, 1 uppercase letter, 1 number, and be at least 8 characters long." };
            } else if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
                return { success: false, reason: "Invalid username. A username may only include alphanumeric characters, underscores, and be a length of 3 to 16 characters." };
            } else {
                accounts[username] = password;
                players[username] = { username, displayName, wins: 0, losses: 0, gamesCreated: 0, connected: false };
                console.log(`signed up, Username: ${username} Password: ${password}`);
                console.log(players);
                loginHandler.loginAccount(req);
                return { success: true };
            }
        },
        loginAccount: (req) => {
            let displayName = req.body.username;
            let username = req.body.username.toLowerCase();
            if (accounts[username] === req.body.password) {
                req.session.username = username;
                req.session.isGuest = false;
                if (!players[username]) {
                    players[username] = { username, displayName, wins: 0, losses: 0, gamesCreated: 0, connected: false };
                }
                return { success: true };
                // server.gameHandler.socketToPlayer[socket.id] = username;
                // socket.emit("loginSuccess");
            } else {
                return { success: false, reason: "The username or password is incorrect." };
            }
        },
        saveData: () => {
            for (let p in players) {
                let plyr = players[p];
                if (plyr.isGuest) {
                    delete players[p]
                } else {
                    delete plyr.board;
                    delete plyr.socket;
                    plyr.connected = false;
                }
            }
            jsonfile.writeFileSync("./data/players.json", players);
            jsonfile.writeFileSync("./data/accounts.json", accounts);
        }
    }
    return server.loginHandler = loginHandler;
}