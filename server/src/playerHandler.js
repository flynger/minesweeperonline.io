module.exports = (server) => {
    const jsonfile = require("../node_modules/jsonfile");
    var { io } = server; // tells you what properties of server are imported
    var playerHandler = {
        nameToSocket: {},
        // getNameFromSocket() {

        // }
    }

    return server.playerHandler = playerHandler;
}