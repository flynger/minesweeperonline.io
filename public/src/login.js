/*
Alex Ge, Arnav Singh, Richard Wei, Will Gannon

This file implements logic for the login page
*/
// checks if theme is dark
if (localStorage.getItem("theme") === "DARK") {
    DarkReader.setFetchMethod(window.fetch);
    DarkReader.enable();
}

// handles login-page submissions
$(function () {
    // $("#header").load("header.html", () => {
    //     document.body.style.display = "block";
    //     $("#footer").load("footer.html");
    // });
    $('#login-form').on('submit', function (e) {
        e.preventDefault();
        let data = $("#login-form").serialize();
        $.post("/login", data, (response) => {
            if (response.success) {
                window.location.href = "/home";
            } else {
                $("#login-fail").html(response.reason);
                $("#login-fail")[0].style.display = "inherit";
            }
        });
    });
});