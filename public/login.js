// login.js

document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // Zapobiega domyślnemu działaniu formularza

        // Pobierz dane z formularza
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            // Użyj dynamicznego adresu bazowego
            const response = await fetch(`${window.location.origin}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                // Przekierowanie do strony głównej po pomyślnym zalogowaniu
                window.location.href = "/strona-glowna.html";
            } else {
                const errorText = await response.text();
                alert(`Błąd logowania: ${errorText}`);
            }
        } catch (error) {
            console.error("Błąd przy logowaniu:", error);
            alert("Wystąpił błąd serwera. Spróbuj ponownie później.");
        }
    });
});
