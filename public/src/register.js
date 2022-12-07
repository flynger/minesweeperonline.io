socket.on("usernameExists", () => {
    $("#nameTaken").show();
});

socket.on("accountCreated", () => {
    alert("Your account has been created! Please sign in.");
    window.location.href = "/login";
});

$(document).ready(function () {
    $("#registerButton").unbind("click").on("click", e => {
        let usernameInput = $("#usernameInput").val();
        let passwordInput = $("#passwordInput").val();
        if (usernameInput && passwordInput) {
            socket.emit("register", { username: usernameInput, password: passwordInput });
        }
    });
});