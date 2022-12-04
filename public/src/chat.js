var chatBarDefault = "0px";
var chatBarOpen = "425px";
var currentChat = "Global";
var chatRooms = ["Global", "Room"];
var roomColors = {
    selected: "rgba(217, 220, 229)",
    unselected: "rgba(150, 150, 170)"
};

function setupChat() {
    selectChat("Global");
    $("#chatBar").on("click", e => {
        e.preventDefault();
        switch (e.which) {
            case KEYCODE.LEFT_CLICK:
                $("#chatBody").toggle();
        }
    });
    $("#chatRooms").on("click", e => {
        e.preventDefault();
        switch (e.which) {
            case KEYCODE.LEFT_CLICK:
                //checks if clicked on room
                if ($(e.target).attr("name") == "room") {
                    let roomClickedOn = $(e.target).attr("id").slice(6);

                    //checks if clicked room is different from current room
                    if (roomClickedOn != currentChat) {
                        selectChat(roomClickedOn);
                    }
                }
        }
    });
    $("#roomButton").on("click", e => {
        let roomInput = $("#roomInput").val();
        socket.emit("joinRoom", { room: roomInput })
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
                socket.emit("chatMessage", { msg: typedMessage });
            }

            // clear chat
            $("#chatInput").val("");
        }
    });
}

function addChatMessage(user, msg) {
    addTextToChat("<b>" + user + ":</b><text> " + msg + "</text>");
}

function addServerMessage(msg) {
    addTextToChat("<text style='color:red;'>" + msg + "</text>");
}

function addTextToChat(text) {
    $("#chatText").html($("#chatText").html() + text + "<br>");
    $("#chatText")[0].scrollTo(0, $("#chatText")[0].scrollHeight);
}

function selectChat(chat) {
    $("#select" + currentChat).css({ "background-color": roomColors.unselected, "border-bottom": "solid black 2px" });
    $("#select" + chat).css({ "background-color": roomColors.selected, "border-bottom": roomColors.selected + " solid" });
    currentChat = chat;
    addServerMessage(`Joined ${chat} Chat`);
}