let workdaysData = []; // Zmienna do przechowywania dni pracy

const displayWorkdays = async () => {
    try {
        // Resetuj workdaysData, aby wymusić ponowne pobranie danych
        workdaysData = [];

        console.log('Rozpoczynam pobieranie dni pracy z serwera...');
        const response = await fetch('/workdays'); // Endpoint do pobierania danych o dniach pracy

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status} - ${response.statusText}`);
        }

        workdaysData = await response.json(); // Zakładam, że dane są zwracane w formacie JSON

        if (!workdaysData || !Array.isArray(workdaysData) || workdaysData.length === 0) {
            console.warn('Brak danych o dniach pracy lub dane są w złym formacie!');
            return;
        }

        console.log('Dni pracy pomyślnie pobrane z serwera:', workdaysData);

        // Iteracja po wszystkich dniach pracy
        workdaysData.forEach(workday => {
            if (!workday.cellId || !workday.employee || !workday.date || !workday.task) {
                console.error(`Niekompletne dane dla wpisu pracy: ${JSON.stringify(workday)}`);
                return; // Pomijamy wpis, jeśli brakuje jakiejś kluczowej informacji
            }

            console.log(`Próbuję znaleźć komórkę dla cellId: ${workday.cellId}`);

            // Znalezienie odpowiedniej komórki w kalendarzu na podstawie ID komórki (cellId)
            const cell = document.querySelector(`.day[data-cellid="${workday.cellId}"]`);

            if (cell) {
                console.log(`Znaleziono komórkę dla cellId: ${workday.cellId}. Tworzę akordeon dla ${workday.employee}`);

                // Tworzenie elementu akordeonu
                const entry = document.createElement('div');
                entry.className = 'workday-entry'; // Klasa CSS dla stylizacji
                entry.setAttribute('data-cellid', workday.cellId); // Dodaj atrybut data-cellid
                entry.setAttribute('data-id', workday._id); // Dodaj atrybut data-id dla _id

                // Dodanie nagłówka z informacjami o pracowniku i dacie
                const accordionHeader = document.createElement('div');
                accordionHeader.className = 'accordion-header';
                let headerContent = `<span>${workday.employee}</span>`; // Zawsze wyświetlamy imię pracownika

                // Sprawdzamy typ zadania i dodajemy odpowiednią informację
                if (workday.task === 'urlop') {
                    headerContent += `<span>${workday.leaveType || 'Brak typu urlopu'}</span>`; // Jeśli zadanie to urlop, wyświetlamy leaveType
                } else if (workday.task === 'sprawdzanieRaportów') {
                    headerContent += `<span>Raporty: ${workday.reportNumber || 'Brak numeru raportu'}</span>`; // Jeśli zadanie to sprawdzanie raportów, wyświetlamy reportNumber
                } else {
                    headerContent += `<span> ${workday.task}</span>`; // Obsługa innych zadań
                }

                accordionHeader.innerHTML = headerContent; // Ustawiamy zawartość nagłówka

// Zastosowanie klas kolorów w zależności od typu zadania
if (workday.task === 'sprawdzanieRaportów') {
    accordionHeader.classList.add('red'); // Dodanie klasy czerwonej dla sprawdzania raportów
} else if (workday.task === 'urlop') {
    accordionHeader.classList.add('blue'); // Dodanie klasy niebieskiej dla urlopu
} else if (workday.task === 'dyżur') {
    accordionHeader.classList.add('yellow'); // Dodanie klasy żółtej dla dyżuru
} else if (workday.task === 'dzień wolny nienaruszalny') {
    accordionHeader.classList.add('green'); // Dodanie klasy zielonej dla dnia wolnego
} else if (workday.task === 'nieobecność nieusprawiedliwiona') {
    accordionHeader.classList.add('orange'); // Dodanie klasy pomarańczowej dla nieusprawiedliwionej nieobecności
} else if (workday.task === 'szkolenie') {
    accordionHeader.classList.add('purple'); // Dodanie klasy fioletowej dla szkolenia
} else if (workday.task === 'zastępstwo') {
    accordionHeader.classList.add('pink'); // Dodanie klasy różowej dla zastępstwa
} else if (workday.task === 'zawieszenie') {
    accordionHeader.classList.add('gray'); // Dodanie klasy szarej dla zawieszenia
} else if (workday.task === 'oddelegowanie') {
    accordionHeader.classList.add('cyan'); // Dodanie klasy cyjanowej dla oddelegowania
} else if (workday.task === 'inne czynności służbowe') {
    accordionHeader.classList.add('light-blue'); // Dodanie klasy jasnoniebieskiej dla innych czynności
} else {
    accordionHeader.style.backgroundColor = '#ddd'; // Domyślny kolor dla innych zadań
}

                // Dodanie treści zadania w rozwijanej części akordeonu
                const accordionContent = document.createElement('div');
                accordionContent.className = 'accordion-content';
                accordionContent.innerText = `${workday.task}: ${workday.details || 'Brak dodatkowych informacji'}`;

                // Dodanie elementów do komórki
                entry.appendChild(accordionHeader);
                entry.appendChild(accordionContent);
                cell.appendChild(entry); // Upewnij się, że entry jest dodawane do komórki

                console.log(`Akordeon dla cellId: ${workday.cellId} został dodany poprawnie.`);
            } else {
                console.error(`Nie znaleziono komórki w kalendarzu dla cellId: ${workday.cellId}`);
            }
        });
    } catch (error) {
        console.error('Błąd podczas pobierania lub przetwarzania dni pracy:', error);
        alert(`Wystąpił błąd: ${error.message}. Sprawdź konsolę, aby uzyskać więcej informacji.`);
    }
};

// Funkcja do otwierania modalu
const openModal = (date, employee, cellId) => {
    document.getElementById('modalDate').innerText = date; 
    document.getElementById('eventDate').value = date; 
    document.getElementById('modalCellId').value = cellId; 
    document.getElementById('employee').value = employee; 

    // Wyświetl modal
    document.getElementById('modal').style.display = 'block'; 
};

// Funkcja do zamykania modalu
const closeModal = () => {
    document.getElementById('modal').style.display = 'none'; 
};

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    initializeAccordionHeaders();
});

// Obsługa zdarzeń dla przycisków "Poprzedni tydzień" i "Następny tydzień"
document.getElementById('prevWeek').addEventListener('click', () => {
    console.log('Przycisk "Poprzedni tydzień" został kliknięty.');
    displayWorkdays(); // Wywołanie funkcji do ponownego pobrania danych
});

document.getElementById('nextWeek').addEventListener('click', () => {
    console.log('Przycisk "Następny tydzień" został kliknięty.');
    displayWorkdays(); // Wywołanie funkcji do ponownego pobrania danych
});

// Wywołanie funkcji po załadowaniu strony
window.onload = () => {
    console.log('Ładowanie strony zakończone. Wywołanie funkcji displayWorkdays...');
    displayWorkdays();
};
