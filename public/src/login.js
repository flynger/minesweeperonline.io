// socket.on("loginFail", () => {
//     alert("Login Failed");
// });

// socket.on("loginSuccess", () => {
//     alert("Login Succeeded");
//     window.localStorage.setItem("username", usernameInput);
//     window.localStorage.setItem("password", passwordInput);
//     window.location.href = "/home";
// });


// $(document).ready(function () {
//     $("#loginButton").unbind("click").on("click", e => {
//         var usernameInput = $("#usernameInput").val();
//         var passwordInput = $("#passwordInput").val();
//         if (usernameInput && passwordInput) {
//             socket.emit("login", { username: usernameInput, password: passwordInput });
//         }
//     });
// });