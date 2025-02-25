document.getElementById("mainButton").addEventListener("click", function () {
    let menu = document.getElementById("dropdownMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
});

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
    let dropdown = document.querySelector(".dropdown");
    if (!dropdown.contains(event.target)) {
        document.getElementById("dropdownMenu").style.display = "none";
    }
});

// Handle option click
function optionClicked(optionNumber) {
    alert("You clicked Option " + optionNumber);
}
