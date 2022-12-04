module.exports = (server) => {
    const filters = require("../libs/filters"); // chat filters
    var { io } = server; // tells you what properties of server are imported

    var chatHandler = {
        processChat: (socket, data) => {
            console.log("Message received, Room:", ...socket.rooms);
            let message = filterMessage(data.msg);

            // if msg too long send an error back, else send it to all users
            if (message.length > 50) {
                socket.emit("chatMessage", { user: "Server", msg: `Your message is longer than 50 characters. (${message.length} characters)` });
            } else {
                io.to("global").emit("chatMessage", { user: "Guest " + socket.id.substring(0, 4), msg: message });
            }
        }
    }

    // helper functions
    function filterMessage(message) {
        //filter bad so it is retired

        // for (let i of filters) {
        //     if (message.toLowerCase().includes(i)) {
        //         message = message.replace(new RegExp(i, "gi"), "*".repeat(i.length));
        //     }
        // }
        return message.replace(/<\/?[^>]+(>|$)/g, "");
    }

    // return chatHandler object
    return server.chatHandler = chatHandler;
}