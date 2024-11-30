document.addEventListener('DOMContentLoaded', function () {
    const calendarBody = document.getElementById('calendarBody');
    const employees = ["SA-100", "PS-100", "KZ-100", "SP-100", "SP-101", "SP-102", "SP-103", "SP-104", "SP-105", "SP-106"];
    let currentDate = new Date();
    let currentWeekStart = getStartOfWeek(currentDate);

    function getStartOfWeek(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Poniedziałek jako początek
        return new Date(date.setDate(diff));
    }

    function renderCalendar() {
        const startOfWeek = currentWeekStart;
        const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });

        // Reset tabeli
        calendarBody.innerHTML = '';

        // Tworzenie nagłówków dni
        const headerRow = document.querySelector('thead tr');
        headerRow.innerHTML = '<th>Pracownik</th>';
        daysOfWeek.forEach((day, index) => {
            const th = document.createElement('th');
            th.textContent = day.toLocaleDateString('pl-PL');
            th.id = `dayHeader${index + 1}`;
            headerRow.appendChild(th);
        });

        // Tworzenie wierszy dla każdego pracownika
        employees.forEach((employee, employeeIndex) => {
            const row = document.createElement('tr');
            const employeeCell = document.createElement('td');
            employeeCell.textContent = employee;
            row.appendChild(employeeCell);

            // Tworzenie komórek dla każdego dnia w tygodniu
            daysOfWeek.forEach((day) => {
                const dayCell = document.createElement('td');
                dayCell.classList.add('day');
                dayCell.setAttribute('data-date', day.toISOString());  // Użycie pełnej daty
                dayCell.setAttribute('data-employee', employee);

                // Tworzenie unikalnego ID komórki z dniem, miesiącem i rokiem
                const cellId = `day-${employeeIndex}-${day.getDate()}-${day.getMonth() + 1}-${day.getFullYear()}`;
                dayCell.setAttribute('data-cellid', cellId);
                dayCell.id = cellId;

                const addButton = document.createElement('button');
                addButton.textContent = '+';
                addButton.classList.add('add-button');
                addButton.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openModal(day, employee, cellId);
                });

                dayCell.appendChild(addButton);
                row.appendChild(dayCell);
            });

            calendarBody.appendChild(row);
        });
    }

    function changeWeek(offset) {
        currentWeekStart.setDate(currentWeekStart.getDate() + offset * 7);
        renderCalendar();
    }

    function openModal(day, employee, cellId) {
        const modal = document.getElementById('modal');
        const modalDate = document.getElementById('modalDate');
        const eventDate = document.getElementById('eventDate');
        const employeeInput = document.getElementById('employee');
        const modalCellId = document.getElementById('modalCellId');
    
        const fullDate = day.toLocaleDateString('pl-PL');
        modalDate.textContent = `Wydarzenie na ${fullDate} - ${employee}`;
        eventDate.value = fullDate; 
        employeeInput.value = employee; 
        modalCellId.value = cellId; 
    
        modal.style.display = 'flex'; 
        document.body.classList.add('modal-open'); // Blokowanie przewijania

        updateOptions(); 
    }

    window.closeModal = function () {
        const modal = document.getElementById('modal');
        modal.style.display = 'none'; 
        document.body.classList.remove('modal-open'); // Odblokowanie przewijania
        clearModal(); 
    }

    function clearModal() {
        const additionalOptionsDiv = document.getElementById('additionalOptions');
        additionalOptionsDiv.innerHTML = '';

        // Resetowanie wszystkich pól formularza
        const taskSelect = document.getElementById('task');
        if (taskSelect) {
            taskSelect.selectedIndex = 0;
        }
        const detailsInput = document.getElementById('details');
        if (detailsInput) {
            detailsInput.value = '';
        }
        const leaveTypeSelect = document.getElementById('leaveType');
        if (leaveTypeSelect) {
            leaveTypeSelect.selectedIndex = 0;
        }
    }

    const taskSelect = document.getElementById('task');
    if (taskSelect) {
        taskSelect.addEventListener('change', updateOptions);
    }

    function updateOptions() {
        const additionalOptionsDiv = document.getElementById('additionalOptions');
        const selectedTask = taskSelect.value;
        additionalOptionsDiv.innerHTML = '';

        // Dodanie pola szczegóły, domyślnie ukryte
        const detailsLabel = document.createElement('label');
        detailsLabel.textContent = 'Szczegóły:';
        const detailsInput = document.createElement('input');
        detailsInput.type = 'text';
        detailsInput.id = 'details';

        if (selectedTask === 'urlop' || selectedTask === 'sprawdzanieRaportów') {
            detailsLabel.style.display = 'none';
            detailsInput.style.display = 'none';
            detailsInput.disabled = true; // Ustaw pole na tylko do odczytu
        } else {
            detailsInput.value = selectedTask; // Automatycznie wpisz nazwę zadania
            detailsInput.disabled = false; // Włącz możliwość edycji
        }

        additionalOptionsDiv.appendChild(detailsLabel);
        additionalOptionsDiv.appendChild(detailsInput);

        // Typ urlopu
        if (selectedTask === 'urlop') {
            const leaveTypeLabel = document.createElement('label');
            leaveTypeLabel.textContent = 'Typ urlopu:';
            additionalOptionsDiv.appendChild(leaveTypeLabel);

            const leaveTypeSelect = document.createElement('select');
            leaveTypeSelect.id = 'leaveType';
            leaveTypeSelect.innerHTML = `
                <option value="płatny">Płatny</option>
                <option value="bezpłatny">Bezpłatny</option>
                <option value="na żądanie">Na żądanie</option>
                <option value="zwolnienie lekarskie">Zwolnienie lekarskie</option>
            `;
            additionalOptionsDiv.appendChild(leaveTypeSelect);
        } else if (selectedTask === 'sprawdzanieRaportów') {
            const reportNumberLabel = document.createElement('label');
            reportNumberLabel.textContent = 'Numer raportu:';
            additionalOptionsDiv.appendChild(reportNumberLabel);

            const reportNumberSelect = document.createElement('select');
            reportNumberSelect.id = 'reportNumber';
            reportNumberSelect.innerHTML = `
                <option value="ALL">ALL</option>
                <option value="TK/Z">TK/Z</option>
                <option value="TT/TE">TT/TE</option>
            `;
            additionalOptionsDiv.appendChild(reportNumberSelect);
        }
    }

    document.getElementById('prevWeek').addEventListener('click', () => changeWeek(-1));
    document.getElementById('nextWeek').addEventListener('click', () => changeWeek(1));

    renderCalendar();
});
