var chatBarDefault = "0px";
var chatBarOpen = "425px";
var currentChat = "Global";
var chatRooms = {
    Global: {
        input: "",
        output: ""
    },
    Room: {
        input: "",
        output: ""
    },
};
var roomColors = {
    selected: "rgba(217, 220, 229)",
    unselected: "rgba(150, 150, 170)"
};

function setupChat() {
    selectChat("Global");
    for (let room in chatRooms) {
        addServerMessage(`Joined ${room} Chat`, room);
    }
    $("#chatBar").on("click", e => {
        e.preventDefault();
        switch (e.which) {
            case KEYCODE.LEFT_CLICK:
                $("#chatBody").toggle();
            break;
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
                        updateCurrentChat();
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
                socket.emit("chatMessage", { room: currentChat, msg: typedMessage });
            }

            // clear chat
            $("#chatInput").val("");
        }
    });
}

function addChatMessage(user, msg, room) {
    addTextToChat("<b>" + user + ":</b><text> " + msg + "</text>", room);
}

function addServerMessage(msg, room="Global") {
    addTextToChat("<text style='color:red;'>" + msg + "</text>", room);
}

function addTextToChat(text, room) {
    chatRooms[room].output += text + "<br>";
    updateCurrentChat();
}

function updateCurrentChat() {
    $("#chatText").html(chatRooms[currentChat].output);
    $("#chatText")[0].scrollTo(0, $("#chatText")[0].scrollHeight);
}

function selectChat(chat) {
    $("#select" + currentChat).css({ "background-color": roomColors.unselected, "border-bottom-style": "solid" });
    chatRooms[currentChat].input = $("#chatInput").val();
    $("#select" + chat).css({ "background-color": roomColors.selected, "border-bottom-style": "none" });
    $("#chatInput").val(chatRooms[chat].input);
    currentChat = chat;
}