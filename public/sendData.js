const sendFormData = async (formData) => {
    try {
        const response = await fetch('/workdays', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData.message);
            alert('Wystąpił błąd podczas wysyłania danych: ' + errorData.message);
            throw new Error('Network response was not ok');
        }

        alert('Dane zostały pomyślnie wysłane!');
        
        // Wywołanie funkcji displayWorkdays() oraz renderWorkSummaryTable() po wysłaniu danych
        await displayWorkdays();  
        window.closeModal(); // Zamknij modal po wysłaniu
    } catch (error) {
        console.error('Błąd podczas wysyłania danych:', error);
        alert('Wystąpił błąd podczas wysyłania danych. Sprawdź konsolę, aby uzyskać więcej informacji.');
    }
};

// Event listener dla zapisywania danych z formularza
document.getElementById('eventForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = {
        date: document.getElementById('eventDate').value,
        employee: document.getElementById('employee').value,
        task: document.getElementById('task').value,
        details: document.getElementById('details') ? document.getElementById('details').value : '',
        leaveType: document.getElementById('leaveType') ? document.getElementById('leaveType').value : '',
        reportNumber: document.getElementById('reportNumber') ? document.getElementById('reportNumber').value : '',
        reportScope: document.getElementById('reportScope') ? document.getElementById('reportScope').value : '', // Dodane pole do zakresu raportu
        cellId: document.getElementById('modalCellId').value // Dodane pole ID komórki
    };

    sendFormData(formData);
});

const refreshWorkSummaryTable = async () => {
    // Odświeżenie tabeli po wysłaniu danych
    await displayWorkdays();  // Pobranie nowych danych do tabeli
    initWorkSummaryTable();   // Inicjalizacja i wyświetlenie tabeli
};
