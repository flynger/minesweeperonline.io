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
// $("#login-button").click(e => {
//     alert("hi1");
//     $("#login-form")[0].submit();
// });
$(function () {
    $('#login-form').on('submit', function (e) {
        e.preventDefault();
        let data = $("#login-form").serialize();
        $.post("/login", data, (response) => {
            if (response.success) {
                window.location.href = "/home";
            } else {
                alert("login fail");
            }
        });
        // $.ajax({
        //     type: "POST",
        //     url: "/login",
        //     data: data,
        //     success: function () {
        //         alert("successful logins ent");
        //         // $("#contact_form").html("<div id='message'></div>");
        //         // $("#message")
        //         //     .html("<h2>Contact Form Submitted!</h2>")
        //         //     .append("<p>We will be in touch soon.</p>")
        //         //     .hide()
        //         //     .fadeIn(1500, function () {
        //         //         $("#message").append(
        //         //             "<img id='checkmark' src='images/check.png' />"
        //         //         );
        //         //     });
        //     }
        // });
    });
});