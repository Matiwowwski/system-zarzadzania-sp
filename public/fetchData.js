let workdaysData = []; // Zmienna do przechowywania dni pracy

const displayWorkdays = async () => {
    try {
        // Resetuj dane dni pracy
        workdaysData = [];

        console.log('Rozpoczynam pobieranie dni pracy z serwera...');
        const response = await fetch('/workdays'); // Pobranie danych z serwera

        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status} - ${response.statusText}`);
        }

        workdaysData = await response.json();

        if (!workdaysData || !Array.isArray(workdaysData) || workdaysData.length === 0) {
            console.warn('Brak danych o dniach pracy lub dane są w złym formacie!');
            // Usuwamy stare wpisy, jeśli nie ma nowych danych
            document.querySelectorAll('.day .workday-entry').forEach(entry => entry.remove());
            return;
        }

        console.log('Dni pracy pomyślnie pobrane z serwera:', workdaysData);

        // Usuń wszystkie istniejące elementy związane z dniami pracy
        document.querySelectorAll('.day .workday-entry').forEach(entry => entry.remove());

        // Iteracja po dniach pracy i dodawanie wpisów
        workdaysData.forEach(workday => {
            if (!workday.cellId || !workday.employee || !workday.date || !workday.task) {
                console.error(`Niekompletne dane dla wpisu pracy: ${JSON.stringify(workday)}`);
                return;
            }

            const cell = document.querySelector(`.day[data-cellid="${workday.cellId}"]`);

            if (!cell) {
                console.error(`Nie znaleziono komórki dla cellId: ${workday.cellId}`);
                return;
            }

            // Tworzenie elementu dla wpisu w akordeonie
            const entry = document.createElement('div');
            entry.className = 'workday-entry';
            entry.setAttribute('data-cellid', workday.cellId);
            entry.setAttribute('data-id', workday._id);

            // Tworzenie nagłówka akordeonu
            const header = document.createElement('div');
            header.className = 'accordion-header';

            // Generowanie zawartości nagłówka w zależności od typu zadania
            let headerContent = `<span>${workday.employee}</span>`;

            if (workday.task === 'urlop') {
                headerContent += `<span>${workday.leaveType || 'Brak typu urlopu'}</span>`;
            } else if (workday.task === 'sprawdzanieRaportów') {
                headerContent += `<span>Raporty: ${workday.reportNumber || 'Brak numeru raportu'}</span>`;
            } else {
                headerContent += `<span>${workday.task}</span>`;
            }

            header.innerHTML = headerContent;
            header.classList.add(getTaskColorClass(workday.task)); // Użycie funkcji pomocniczej

            // Tworzenie zawartości akordeonu
            const content = document.createElement('div');
            content.className = 'accordion-content';
            content.innerText = `${workday.task}: ${workday.details || 'Brak dodatkowych informacji'}`;

            // Dodanie elementów do wpisu i komórki
            entry.appendChild(header);
            entry.appendChild(content);
            cell.appendChild(entry);
        });

    } catch (error) {
        console.error('Błąd podczas pobierania lub przetwarzania dni pracy:', error);
        alert(`Wystąpił błąd: ${error.message}. Sprawdź konsolę, aby uzyskać więcej informacji.`);
    }
};

// Funkcja pomocnicza do przypisywania klasy koloru w zależności od zadania
const getTaskColorClass = (task) => {
    switch (task) {
        case 'sprawdzanieRaportów': return 'red';
        case 'urlop': return 'blue';
        case 'dyżur': return 'yellow';
        case 'dzień wolny nienaruszalny': return 'green';
        case 'nieobecność nieusprawiedliwiona': return 'orange';
        case 'szkolenie': return 'purple';
        case 'zastępstwo': return 'pink';
        case 'zawieszenie': return 'gray';
        case 'oddelegowanie': return 'cyan';
        case 'inne czynności służbowe': return 'light-blue';
        case 'kontrola działu': return 'brown';
        default: return ''; // Domyślny brak klasy
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
