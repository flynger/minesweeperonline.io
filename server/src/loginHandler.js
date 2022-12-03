module.exports = (server) => {
    const jsonfile = require("../node_modules/jsonfile");
    const accounts = jsonfile.readFileSync("./data/accounts.json");
    var { io } = server; // tells you what properties of server are imported
    console.log(`accounts: ${JSON.stringify(accounts)}`);

    var loginHandler = {
        registerAccount: (socket, data) => {
            if (accounts[data.username]) {
                socket.emit("usernameExists");
            } else {
                accounts[data.username] = data.password;
                socket.emit("accountCreated");
            }
        },
        loginAccount: (socket, data) => {

        },
        saveAccountData: () => {
            return jsonfile.writeFileSync("./data/accounts.json", accounts);
        }
    }

    return server.loginHandler = loginHandler;

    // let profiles = JSON.parse(profilesStr);
    // console.log(profiles);


    // checking if username already exists

    // for (let i = 0; i < profiles.length; i++) {
    //     if (data.username == profiles[i].user) {
    //         socket.emit("usernameExists");
    //         break;
    //     }
    // }

    // console.log("registered : \n" + data.username + "\n" + data.password);
    // let profile = {name: [data.username], password: [data.password]}
    // fs.appendFile("profiles.json", profile + ",\n\t");
}