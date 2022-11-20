function setupChat() {
    $("#chatInput").on("keypress", e => {
        // check ENTER
        if ($("#chatInput:focus") && $("#chatInput").val() && e.which === 13) {
            let typedMessage = $("#chatInput").val();
            // send chat to server
            if (typedMessage == "/ping") {
                addServerMessage("Your ping is " + latency + "ms.")
            } else {
                socket.emit("chatMessage", { msg: typedMessage });
            }
            // clear chat
            $("#chatInput").val("");
        }
    });
}

function addChatMessage(user, msg) {
    addTextToChat(user + " said: " + msg);
}

function addServerMessage(msg) {
    addTextToChat("<text style='color:red;'>" + msg + "</text>");
}

function addTextToChat(text) {
    $("#chatText").html($("#chatText").html() + text + "<br>");
    $("#chatText")[0].scrollTo(0, $("#chatText")[0].scrollHeight);
}