var link = "localhost:3000"; //73.109.23.105
var socket = io.connect(link);

$(document).ready(function () {
    $("#registerButton").unbind("click").on("click", e => {
        let usernameInput = $("#usernameInput").val();
        let passwordInput = $("#passwordInput").val();
        if (usernameInput && passwordInput) {
            socket.emit("register", { username: usernameInput, password: passwordInput });
        }
    })
});