let isManualNavigation = true;

// Sprawdzamy, czy nawigacja jest manualna czy automatyczna
document.addEventListener('DOMContentLoaded', () => {
    isManualNavigation = document.referrer === '';
});

function loadScript(scriptSrc, callback) {
    const script = document.createElement('script');
    script.src = scriptSrc;

    script.onload = callback;

    document.head.appendChild(script);
}

function loadScriptWithErrorHandling(scriptSrc) {
    const script = document.createElement('script');
    script.src = scriptSrc;

    let timeout; // Timeout dla przekierowania

    script.onload = () => {
        console.log('Skrypt załadowany pomyślnie:', scriptSrc);
        clearTimeout(timeout); // Czyścimy timeout dla przekierowania
        showPageContent(); // Pokazujemy zawartość strony po załadowaniu skryptu
    };

    script.onerror = () => {
        console.error('Błąd ładowania skryptu:', scriptSrc);
        handleError(); // Obsługujemy błąd ładowania skryptu
    };

    document.head.appendChild(script);

    // Ustawiamy timeout na przekierowanie do localhost:5000 po błędzie z data-time.js
    timeout = setTimeout(() => {
        console.log('Timeout - przekierowanie do localhost:5000');
        handleError(); // Obsługujemy błąd ładowania skryptu
    }, 2000); // Timeout ustawiony na 2000 ms (2 sekundy)
}

function handleError() {
    console.error("Błąd pobierania danych. Przekierowanie na aktualny link.");
    const baseUrl = window.location.origin + window.location.pathname.split('/')[0];
    window.location.href = baseUrl; // Przekierowanie na zaktualizowany link
}

function showWhiteScreen() {
    document.body.innerHTML = ''; // Usuwamy całą zawartość body
    document.documentElement.style.backgroundColor = 'white'; // Ustawiamy białe tło dla całego dokumentu
    document.body.style.visibility = 'visible'; // Ustawiamy widoczność body na widoczne
}

function showPageContent() {
    if (isManualNavigation) {
        // Jeśli nawigacja jest manualna, pokazujemy biały ekran zamiast docelowej strony
        showWhiteScreen();
        setTimeout(() => {
            if (localStorage.getItem('username')) {
                // Jeśli są dane użytkownika, pokazujemy zawartość strony
                document.body.innerHTML = '<h1>Strona główna</h1>'; // Przykładowa zawartość strony
            } else {
                // Jeśli nie ma danych użytkownika, przekierowujemy na localhost:5000
                handleError();
            }
        }, 2000); // Pokaż zawartość po upływie 2 sekund
    } else {
        // Jeśli nawigacja jest automatyczna, natychmiastowo pokazujemy zawartość strony
        document.body.style.visibility = 'visible';
        runDataTimeScript(); // Uruchamiamy skrypt data-time.js
    }
}

// Dodajemy nasłuchiwanie na niestandardowe zdarzenie informujące o błędzie
window.addEventListener('userInfoError', (event) => {
    console.error('Znaleziono błąd związany z brakiem danych użytkownika:', event.detail);
    handleError();
});

// Ukrywamy stronę do czasu jej załadowania
document.body.style.visibility = 'hidden';

// Pokaż zawartość strony dla automatycznej nawigacji
document.addEventListener('DOMContentLoaded', () => {
    showPageContent();
});
