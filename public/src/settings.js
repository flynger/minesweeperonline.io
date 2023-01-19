$(function () {
    let { theme = "LIGHT", chording="ALL" } = localStorage;
    $("input[name='theme']").val([theme]);
    $("input[name='chording']").val([chording]);

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