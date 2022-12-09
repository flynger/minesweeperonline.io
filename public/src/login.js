socket.on("loginFail", () => {
    alert("Login Failed");
});

socket.on("loginSuccess", () => {
    alert("Login Succeeded");
    window.location.href = "/home";
});


$(document).ready(function () {
    $("loginButton").unbind("click").on("click", e => {
        let usernameInput = $("#usernameInput").val();
        let passwordInput = $("#passwordInput").val();
        if (usernameInput && passwordInput) {
            socket.emit("login", { username: usernameInput, password: passwordInput });
        }
    });
});