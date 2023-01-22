$(function () {
    // $("#header").load("header.html", () => {
    //     document.body.style.display = "block";
        if (localStorage.getItem("theme") === "DARK") {
            DarkReader.setFetchMethod(window.fetch);
            DarkReader.enable();
        }
    //     $("#footer").load("footer.html");
    // });
    $('#register-form').on('submit', function (e) {
        e.preventDefault();
        let data = $("#register-form").serialize();
        $.post("/register", data, (response) => {
            if (response.success) {
                window.location.href = "/home";
            } else {
                $("#register-fail").html(response.reason);
                $("#register-fail")[0].style.display = "inherit";
            }
        });
    });
});


// socket.on("usernameExists", () => {
//     $("#nameTaken").show();
// });

// socket.on("accountCreated", () => {
//     alert("Your account has been created! Please sign in.");
//     window.location.href = "/login";
// });

// $(document).ready(function () {
//     $("#registerButton").unbind("click").on("click", e => {
//         let usernameInput = $("#usernameInput").val();
//         let passwordInput = $("#passwordInput").val();
//         if (usernameInput && passwordInput) {
//             socket.emit("register", { username: usernameInput, password: passwordInput });
//         }
//     });
// });