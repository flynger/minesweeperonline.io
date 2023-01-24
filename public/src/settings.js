/*
Alex Ge, Arnav Singh, Richard Wei, Will Gannon

This file implements logic for the settings page
*/
// handles events for settings page
$(function () {
<<<<<<< Updated upstream
    // sets radio buttons to settings stored in local storage
    let { theme = "LIGHT", chording="ALL" } = localStorage;
=======
    let { theme = "LIGHT", chording = "ALL" } = localStorage;
>>>>>>> Stashed changes
    $("input[name='theme']").val([theme]);
    $("input[name='chording']").val([chording]);

    // event handlers save settings to local storage
    $("input[name='theme']").on("change", e => {
        e.preventDefault();
        localStorage.setItem("theme", e.target.value);
        location.reload();
    });

    $("input[name='chording']").on("change", e => {
        e.preventDefault();
        localStorage.setItem("chording", e.target.value);
    });
});