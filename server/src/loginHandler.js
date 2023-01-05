module.exports = (server) => {
    const jsonfile = require("../node_modules/jsonfile");
    const accounts = jsonfile.readFileSync("./data/accounts.json");
    var { io, players } = server; // tells you what properties of server are imported
    console.log(`accounts: ${JSON.stringify(accounts)}`);

    var loginHandler = {
        registerAccount: (req) => {
            let displayName = req.body.username;
            let username = displayName.toLowerCase();
            let password = req.body.password;
            if (accounts[username]) {
                return { success: false, reason: "An account with the provided username already exists." };
                //socket.emit("usernameExists");
            } else {
                accounts[username] = password;
                players[username] = { username, displayName, wins: 0, losses: 0, gamesCreated: 0 };
                console.log(`signed up, Username: ${username} Password: ${password}`);
                console.log(players);
                return { success: true };
            }
        },
        loginAccount: (req) => {
            let username = req.body.username.toLowerCase();
            if (accounts[username] === req.body.password) {
                req.session.username = username;
                req.session.isGuest = false;
                return { success: true };
            } else {
                return { success: false, reason: "The username or password is incorrect." };
            }
        },
        saveAccountData: () => {
            return jsonfile.writeFileSync("./data/accounts.json", accounts);
        }
    }

    return server.loginHandler = loginHandler;
}