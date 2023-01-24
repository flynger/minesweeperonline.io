/*
Alex Ge, Arnav Singh, Richard Wei, Will Gannon

This file implements the logic for the register page
*/
// handles register page submissions
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