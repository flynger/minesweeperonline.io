var chatBarDefault = "0px";
var chatBarOpen = "425px";
var currentChat = "Global";

function setupChat() {
    $("#chatBar").on("click", e => {
        e.preventDefault();
        switch(e.which) {
            case KEYCODE.LEFT_CLICK:
                if($("#chatBar").css("bottom") !== chatBarOpen) {
                    $("#chatBar").css({bottom: chatBarOpen});
                    $("#chatOpen").css({display: "block"});
                }
                else {
                    $("#chatBar").css({bottom: chatBarDefault, "border-bottom-style": "none"});
                    $("#chatOpen").css({display: "none"});
                }
        }
    });
    $("#selectGlobal").on("click", e => {
        e.preventDefault();
        switch(e.which) {
            case KEYCODE.LEFT_CLICK:
                if(currentChat === "Room") {
                    $("#selectGlobal").css({"background-color": "rgba(178, 185, 202, 0)", "border-bottom-style": "none"});
                    $("#selectRoom").css({"background-color": "rgba(123, 137, 166, 0.5)", "border-bottom-style": "solid"});
                    currentChat = "Global";
                    addServerMessage("Joined Global Chat");
                }
        }
    });
    $("#selectRoom").on("click", e => {
        e.preventDefault();
        switch(e.which) {
            case KEYCODE.LEFT_CLICK:
                if(currentChat === "Global") {
                    $("#selectGlobal").css({"background-color": "rgba(123, 137, 166, 0.5)", "border-bottom-style": "solid"});
                    $("#selectRoom").css({"background-color": "rgba(178, 185, 202, 0)", "border-bottom-style": "none"});
                    currentChat = "Room";
                    addServerMessage("Joined Room Chat");
                }
        }
    });
    $("#roomButton").on("click", e => {
        let roomInput = $("#roomInput").val();
        socket.emit("joinRoom", {room:roomInput})
    });

    $("#chatInput").on("keypress", e => {
        // check ENTER
        if ($("#chatInput:focus") && $("#chatInput").val() && e.which === KEYCODE.ENTER) {
            // send chat to server
            let typedMessage = $("#chatInput").val();
            let roomInput = $("#roomInput").val();
            if (typedMessage == "/ping") {
                addServerMessage("Your ping is " + latency + "ms.");
            } else {
                socket.emit("chatMessage", {msg: typedMessage});
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