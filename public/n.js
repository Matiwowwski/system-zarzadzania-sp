function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    
    // Odblokowanie przewijania
    document.body.classList.remove('modal-open');

    clearModal(); // Jeśli masz funkcję do czyszczenia formularza
}

// Przykładowa funkcja do czyszczenia formularza (jeśli jej potrzebujesz)
function clearModal() {
    document.getElementById('modalDate').textContent = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('employee').value = '';
    document.getElementById('task').value = '';
    document.getElementById('modalCellId').value = '';
    document.getElementById('additionalOptions').innerHTML = ''; // Wyczyść dodatkowe opcje
}

// Funkcja otwierająca modal
function openModal(day, employee, cellId) {
    const modal = document.getElementById('modal');
    const modalDate = document.getElementById('modalDate');
    const eventDate = document.getElementById('eventDate');
    const employeeInput = document.getElementById('employee');
    const modalCellId = document.getElementById('modalCellId');

    // Pobranie pełnej daty z obiektu `day`
    const fullDate = day.toLocaleDateString('pl-PL');
    modalDate.textContent = `Wydarzenie na ${fullDate} - ${employee}`;
    eventDate.value = fullDate;  // Ustawienie pełnej daty w formacie DD.MM.YYYY
    employeeInput.value = employee;
    modalCellId.value = cellId;

    modal.style.display = 'flex';
    document.body.classList.add('modal-open'); // Zablokowanie przewijania

    updateOptions(); // Zaktualizuj opcje w modalu
}

// Przykład stylów CSS do odblokowania przewijania
// Dodaj ten kod do swojego pliku CSS
/*
.modal-open {
    overflow: hidden; /* Zablokowanie przewijania */
