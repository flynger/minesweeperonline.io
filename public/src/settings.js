$(function () {
    let { theme } = localStorage;
    if(!theme) {
        localStorage.setItem("theme", "LIGHT");
    }
    else {
        $("input[name='theme']").val([theme]);
    }
    
    $("input[name='theme']").on("change", e => {
        e.preventDefault();
        localStorage.setItem("theme", e.target.value);
    });
});