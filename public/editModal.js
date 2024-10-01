// Funkcja otwierająca modal do edytowania danych
const openEditModal = (workday) => {
    document.getElementById('editModalDate').innerText = `Wydarzenie na ${workday.date} - ${workday.employee}`;
    document.getElementById('editEventDate').value = workday.date;
    document.getElementById('editModalCellId').value = workday.cellId; // Zmienione na _id
    document.getElementById('editEmployee').value = workday.employee;
    document.getElementById('editTask').value = workday.task;
    document.getElementById('editModalId').value = workday._id; // Przypisanie _id

    // Wyświetl dodatkowe opcje na podstawie zadania
    updateEditOptions(workday);

    // Zablokuj przewijanie tła
    document.body.style.overflow = 'hidden';

    // Wyświetl modal
    document.getElementById('editModal').style.display = 'block';
};

// Funkcja zamykająca modal
const closeEditModal = () => {
    document.getElementById('editModal').style.display = 'none';
    
    // Przywróć przewijanie tła
    document.body.style.overflow = '';
};

// Funkcja aktualizująca dodatkowe opcje w modalu edycji na podstawie wybranego zadania
const updateEditOptions = (workday = {}) => {
    const task = document.getElementById('editTask').value;
    const additionalOptions = document.getElementById('editAdditionalOptions');
    additionalOptions.innerHTML = '';

    if (task === 'sprawdzanieRaportów') {
        const reportNumber = workday.reportNumber || '';
        additionalOptions.innerHTML = `
            <div class="form-group">
                <label for="editReportNumber">Numer raportu:</label>
                <select id="editReportNumber">
                    <option value="">Wybierz numer raportu</option>
                    <option value="ALL" ${reportNumber === 'ALL' ? 'selected' : ''}>ALL</option>
                    <option value="TK/Z" ${reportNumber === 'TK/Z' ? 'selected' : ''}>TK/Z</option>
                    <option value="TT/TE" ${reportNumber === 'TT/TE' ? 'selected' : ''}>TT/TE</option>
                </select>
            </div>`;
    } else if (task === 'urlop') {
        const leaveType = workday.leaveType || '';
        additionalOptions.innerHTML = `
             <div class="form-group">
                <label for="editLeaveType">Typ urlopu:</label>
                <select id="editLeaveType">
                    <option value="płatny" ${leaveType === 'płatny' ? 'selected' : ''}>Płatny</option>
                    <option value="bezpłatny" ${leaveType === 'bezpłatny' ? 'selected' : ''}>Bezpłatny</option>
                    <option value="na żądanie" ${leaveType === 'na żądanie' ? 'selected' : ''}>Na żądanie</option>
                    <option value="zwolnienie lekarskie" ${leaveType === 'zwolnienie lekarskie' ? 'selected' : ''}>Zwolnienie lekarskie</option>
                </select>
            </div>`;
    } else {
        // W przypadku innych zadań wyświetl pole szczegóły
        const details = workday.details || ''; // Pobierz szczegóły z workday
        additionalOptions.innerHTML = `
            <div class="form-group">
                <label for="editDetails">Szczegóły:</label>
                <textarea id="editDetails" class="details-textarea" rows="4">${details}</textarea> <!-- Dodano klasę -->
            </div>`;
    }
};

// Funkcja do aktualizacji danych w bazie danych
const updateWorkday = async (workdayId, updatedData) => {
    try {
        const response = await fetch(`/workdays/${workdayId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error('Wystąpił problem z aktualizacją danych.');
        }

        const result = await response.json();
        console.log('Dane zaktualizowane:', result);
        closeEditModal(); // Zamknij modal po pomyślnym zaktualizowaniu

        // Wyświetl alert i odśwież stronę
        alert('Wpis został pomyślnie zaktualizowany!');
        location.reload();
    } catch (error) {
        console.error('Błąd:', error);
    }
};

// Funkcja do usuwania danych z bazy danych
const deleteWorkday = async () => {
    const workdayId = document.getElementById('editModalId').value; // Użyj _id

    if (!workdayId) {
        console.error('ID jest puste.');
        return;
    }

    if (confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
        try {
            const response = await fetch(`/workdays/${workdayId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Błąd:', errorData);
                throw new Error('Wystąpił problem z usunięciem danych.');
            }

            const result = await response.json();
            console.log('Dane usunięte:', result);
            closeEditModal(); // Zamknij modal po pomyślnym usunięciu

            // Wyświetl alert i odśwież stronę
            alert('Wpis został pomyślnie usunięty!');
            location.reload();
        } catch (error) {
            console.error('Błąd:', error);
        }
    }
};

// Obsługa wysyłania formularza edycji
document.getElementById('editEventForm').addEventListener('submit', (event) => {
    event.preventDefault(); // Zablokuj domyślne zachowanie formularza

    // Pobierz ID workday z ukrytego pola w formularzu
    const workdayId = document.getElementById('editModalId').value; // Użyj _id

    // Przygotuj zaktualizowane dane z formularza
    const updatedData = {
        date: document.getElementById('editEventDate').value,
        employee: document.getElementById('editEmployee').value,
        task: document.getElementById('editTask').value,
        reportNumber: document.getElementById('editReportNumber')?.value || '',
        leaveType: document.getElementById('editLeaveType')?.value || '',
        details: document.getElementById('editDetails')?.value || '', // Dodano obsługę pola szczegóły
    };

    // Wywołaj funkcję do aktualizacji danych w bazie
    updateWorkday(workdayId, updatedData);
});

// Dodanie obsługi kliknięcia na akordeon, otwierającej modal edycji
document.addEventListener('click', (event) => {
    const target = event.target.closest('.accordion-header');
    if (target) {
        const workdayId = target.parentElement.getAttribute('data-id'); // Zmiana na data-id
        const workday = workdaysData.find(day => day._id === workdayId); // Użycie _id do znalezienia workday

        if (workday) {
            // Ustawienie hidden input z poprawnym ObjectId
            document.getElementById('editModalId').value = workday._id; // Użyj _id
            openEditModal(workday);
        }
    }
});
