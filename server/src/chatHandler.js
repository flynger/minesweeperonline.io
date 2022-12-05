module.exports = (server) => {
    const filters = require("../libs/filters"); // chat filters
    var { io } = server; // tells you what properties of server are imported

    var chatHandler = {
        processChat: (socket, data) => {
            console.log("Message received, Room:", data.room);
            let message = filterMessage(data.msg);
            let room = data.room;

            // if msg too long send an error back, else send it to all users
            if (message.length > 50) {
                socket.emit("chatMessage", { user: "Server", room: room, msg: `Your message is longer than 50 characters. (${message.length} characters)` });
            } else {
                io.to(room).emit("chatMessage", { user: "Guest " + socket.id.substring(0, 4), room: room, msg: message });
            }
        },
        joinSocketToRoom(socket, room) {
            if (socket.rooms.has(room)) {
                return { error: "You're already in that room." };
            } else if (room.length > 6) {
                return { error: `Your room name is longer than 6 characters. (${room.length} characters)` };
            } else {
                socket.join(room);
                // socket.emit("chatMessage", { user: "Server", room: room, msg: ("Joined chat: " + inputtedRoom) });
                return { success: true };
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