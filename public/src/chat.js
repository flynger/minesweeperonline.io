function setupChat() {
    $("#roomButton").on("click", e => {
        let roomInput = $("#roomInput").val();
        socket.emit("joinRoom", {room:roomInput})
    });

    $("#chatInput").on("keypress", e => {
        // check ENTER
        if ($("#chatInput:focus") && $("#chatInput").val() && e.which === 13) {
            // send chat to server
            let typedMessage = $("#chatInput").val();
            let roomInput = $("#roomInput").val();
            if (typedMessage == "/ping") {
                addServerMessage("Your ping is " + latency + "ms.")
            } else {
                if (roomInput === '') {
                    socket.emit("chatMessage", {msg: typedMessage})
                } else
                {
                    socket.emit("chatMessage", {msg: typedMessage, room: roomInput})
                    //this doesn't work
                    // $("#chatInput").val() = ''
                }
            }
            
            // clear chat
            $("#chatInput").val("");
        }
    });
}

function addChatMessage(user, msg) {
    addTextToChat("<b>" + user + ":</b> " + msg);
}

function addServerMessage(msg) {
    addTextToChat("<text style='color:red;'>" + msg + "</text>");
}

function addTextToChat(text) {
    $("#chatText").html($("#chatText").html() + text + "<br>");
    $("#chatText")[0].scrollTo(0, $("#chatText")[0].scrollHeight);
}