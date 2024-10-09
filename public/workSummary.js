// Tabela podsumowania godzin pracy
document.addEventListener('DOMContentLoaded', async function () {
    const summaryContainer = document.createElement('div');
    summaryContainer.classList.add('summary-container');
    const accordionContainer = document.getElementById('accordionContainer');

    // Nagłówki dla kategorii
    const categories = ['Godziny pracy', 'Urlop płatny', 'Urlop bezpłatny', 'Pozostałe wydarzenia'];
    const employees = ["SA-100", "SP-100", "SP-101", "SP-102", "SP-103", "SP-104", "SP-105"];

    // Funkcja pobierająca dane z endpointu /workdays
    let currentDate = new Date(); // Pobranie aktualnej daty
    let currentMonth = currentDate.getMonth(); // Bieżący miesiąc (0-11)
    let currentYear = currentDate.getFullYear(); // Bieżący rok
    
    const fetchData = async () => {
        try {
            const response = await fetch('/workdays');
            if (!response.ok) {
                throw new Error('Błąd podczas pobierania danych');
            }
            const data = await response.json();
    
            console.log('Pobrane dane:', data); // Dodano logowanie
    
            // Filtrowanie danych tylko dla wybranego miesiąca i roku
            return data.filter(entry => {
                const [day, month, year] = entry.date.split('.'); // Splitujemy datę do formatu DD.MM.YYYY
                const entryMonth = parseInt(month, 10) - 1; // Miesiące zaczynają się od 0
                const entryYear = parseInt(year, 10);   // Rok jako liczba
    
                console.log('Sprawdzanie daty wpisu:', entry.date);
                console.log('Miesiąc wpisu:', entryMonth, 'Rok wpisu:', entryYear);
    
                // Upewnij się, że porównujesz miesiące (entryMonth jest liczony od 0)
                return (entryMonth === currentMonth) && (entryYear === currentYear);
            });
        } catch (error) {
            console.error('Błąd pobierania danych:', error);
            return [];
        }
    };

    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    const renderWorkSummaryTable = async () => {
        summaryContainer.innerHTML = ''; // Czyścimy poprzednią tabelę
        const table = document.createElement('table');
        table.classList.add('summary-table');
    
        // Tworzenie nagłówka
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const emptyHeaderCell = document.createElement('th');
        emptyHeaderCell.textContent = 'Kategoria/Pracownik';
        headerRow.appendChild(emptyHeaderCell);
    
        employees.forEach(employee => {
            const th = document.createElement('th');
            th.textContent = employee;
            headerRow.appendChild(th);
        });
    
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        // Pobierz dane z endpointu i filtruj je według wybranego miesiąca
        const workdays = await fetchData();
    
        // Tworzenie obiektu do przechowywania sum godzin
        const hoursSummary = {};
        employees.forEach(employee => {
            hoursSummary[employee] = {
                'Godziny pracy': 0,
                'Urlop płatny': 0,
                'Urlop bezpłatny': 0,
                'Pozostałe wydarzenia': 0
            };
        });

 // Obliczanie godzin na podstawie danych
 workdays.forEach(entry => {
    const { employee, task, leaveType } = entry;

    if (!employee || !task) {
        console.error(`Brak danych dla wpisu: ${JSON.stringify(entry)}`);
        return; // Pomijamy niekompletne wpisy
    }

    if (task === 'sprawdzanieRaportów') {
        hoursSummary[employee]['Godziny pracy'] += 8; // Dodaj 8 godzin do "Godziny pracy"
    } else if (leaveType === 'płatny') {
        hoursSummary[employee]['Urlop płatny'] += 8; // Dodaj 8 godzin do "Urlop płatny"
    } else if (leaveType === 'bezpłatny') {
        hoursSummary[employee]['Urlop bezpłatny'] += 8; // Dodaj 8 godzin do "Urlop bezpłatny"
    } else {
        hoursSummary[employee]['Pozostałe wydarzenia'] += 8; // Dodaj 8 godzin do "Pozostałe wydarzenia"
    }
});

// Tworzenie wierszy dla każdej kategorii
const tbody = document.createElement('tbody');
categories.forEach(category => {
    const row = document.createElement('tr');

    const categoryCell = document.createElement('td');
    categoryCell.textContent = category;
    row.appendChild(categoryCell);

    employees.forEach(employee => {
        const dataCell = document.createElement('td');
        const hours = hoursSummary[employee][category] || 0;
        dataCell.textContent = `${hours} godzin`; // Formatowanie liczby godzin jako "X godzin"
        row.appendChild(dataCell);
    });

    tbody.appendChild(row);
});

table.appendChild(tbody);
summaryContainer.appendChild(table);
accordionContainer.appendChild(summaryContainer);
};
    // Funkcje do obsługi przycisków nawigacji między miesiącami
    const handlePreviousMonth = () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        updateMonthDisplay();
        renderWorkSummaryTable();
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        updateMonthDisplay();
        renderWorkSummaryTable();
    };

    const updateMonthDisplay = () => {
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    };

    // Tworzenie przycisków do nawigacji
    const navContainer = document.createElement('div');
    navContainer.classList.add('nav-container');

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Poprzedni miesiąc';
    prevButton.addEventListener('click', handlePreviousMonth);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Następny miesiąc';
    nextButton.addEventListener('click', handleNextMonth);

    const monthDisplay = document.createElement('span');
    monthDisplay.classList.add('month-display');
    monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    navContainer.appendChild(prevButton);
    navContainer.appendChild(monthDisplay);
    navContainer.appendChild(nextButton);

    // Dodanie przycisków nawigacyjnych poniżej tabeli
    accordionContainer.appendChild(navContainer);

    // Wywołanie funkcji do renderowania tabeli po załadowaniu strony
    updateMonthDisplay();
    renderWorkSummaryTable();
});
