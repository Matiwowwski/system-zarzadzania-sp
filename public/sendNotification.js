// Mapa użytkowników
const userMap = {
    'SA-100': '528230911507038208',
    'PS-100': '637389583562309636',
    'SP-100': '665270450091458601',
    'SP-101': '775738195241205770',
    'SP-102': '509475271871561734',
    'SP-103': '805745794010579015',
    'SP-104': '528618523308720149',
    'SP-105': '811164013026607145',
};

// Funkcja do pingowania użytkownika
const getUserId = (employee) => {
    return userMap[employee] || employee; // Zwraca ID użytkownika lub nazwę, jeśli nie ma w mapie
};

// Funkcja do wysyłania powiadomienia
async function sendNotification() {
    // Pobierz dane z formularza
    const employee = document.getElementById('employee').value;
    const durationType = document.getElementById('duration-type').value;
    const durationAmount = parseInt(document.getElementById('duration-amount').value, 10);
    const reportDate = document.getElementById('report-date').value; // Pobieramy datę zdania raportu

    // Sprawdź, czy wszystkie pola są wypełnione
    if (!employee || !durationType || !durationAmount || !reportDate) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    // Formatowanie daty
    const formattedDate = new Date(reportDate).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // Oblicz datę końca (północ następnego dnia) na podstawie wprowadzonego czasu
    const futureDate = new Date();
    
    // Sprawdzanie jednostki czasu
    if (durationType === 'godzin') {
        futureDate.setHours(futureDate.getHours() + durationAmount);
    } else if (durationType === 'dni') {
        futureDate.setDate(futureDate.getDate() + durationAmount);
    }
    
    // Ustaw na północ następnego dnia
    futureDate.setDate(futureDate.getDate() + 1);
    futureDate.setHours(0, 0, 0, 0); // Ustaw godziny, minuty, sekundy i milisekundy na 00:00

    const timestamp = Math.floor(futureDate.getTime() / 1000); // Konwertuj na sekundy

    // Zbudowanie danych powiadomienia
    const userId = getUserId(employee);
    const message = {
        content: `<@${userId}>`, // Ping użytkownika przez ID w formacie <@ID>
        embeds: [
            {
                title: "Przypomnienie o kończącym się terminie!",
                description: `Przypominam o sprawdzeniu raportów z **${formattedDate}**!`,
                color: 16753920, // Kolor niebieski
                fields: [
                    {
                        name: "Pozostały czas na sprawdzenie:",
                        value: `${durationAmount} ${durationType}`,
                        inline: true
                    },
                    {
                        name: "Do końca czasu:",
                        value: `<t:${timestamp}:R>`, // Dodaj timestamp
                        inline: true
                    }
                ],
                footer: {
                    text: "Proszę zakończyć sprawdzanie raportów jak najszybciej!"
                }
            }
        ]
    };

    console.log('Wysyłam wiadomość:', JSON.stringify(message, null, 2)); // Loguj wiadomość przed wysłaniem

    // Wysyłanie powiadomienia do webhooka
    fetch('https://discord.com/api/webhooks/1299764781041062019/AduCrdUGtqYLfrqJiiYqltNW4TcoWqcSwaQ78iX0zU5jfo64qva6KUn2FCiJc8LWpE_E', { // Zamień na swój URL webhooka
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    })
    .then(response => {
        if (response.ok) {
            alert('Powiadomienie zostało wysłane!');
        } else {
            alert('Wystąpił błąd podczas wysyłania powiadomienia.');
        }
    })
    .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas wysyłania powiadomienia.');
    });
}
