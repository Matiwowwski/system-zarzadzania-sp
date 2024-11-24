// URL webhooka
const webhookUrl = 'https://discord.com/api/webhooks/1299764781041062019/AduCrdUGtqYLfrqJiiYqltNW4TcoWqcSwaQ78iX0zU5jfo64qva6KUn2FCiJc8LWpE_E';

// Mapa użytkowników
const userMap = {
    'SA-100': '528230911507038208',
    'PS-100': '637389583562309636',
    'KZ-100': '509475271871561734',
    'SP-100': '665270450091458601',
    'SP-101': '775738195241205770',
    'SP-102': '509475271871561734',
    'SP-103': '805745794010579015',
    'SP-104': '528618523308720149',
    'SP-105': '811164013026607145',
    'SP-106': '599682381913260034',
    'SP-107': '690559064773623818',
};

// Funkcja do pingowania użytkownika
const getUserId = (employee) => {
    return userMap[employee] || employee; // Zwraca ID użytkownika lub nazwę, jeśli nie ma w mapie
};

// Funkcja do wysyłania powiadomienia o zakończonym czasie na sprawdzenie raportów
async function sendEndingNotification(endingEmployee, endingScope, endingReportDate) {
    // Sprawdzenie, czy wszystkie pola są wypełnione
    if (!endingEmployee || !endingScope || !endingReportDate) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const formattedDate = new Date(endingReportDate).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const userId = getUserId(endingEmployee);
    const message = {
        content: `<@${userId}>`,
        embeds: [
            {
                title: "Zakończenie czasu na sprawdzenie!",
                description: `Przypominam o zakończeniu terminu sprawdzenia raportów z **${formattedDate}**!`,
                color: 16711680,
                fields: [
                    {
                        name: "Zakres sprawdzania:",
                        value: endingScope,
                        inline: true
                    }
                ],
                footer: {
                    text: "Proszę zakończyć sprawdzanie raportów jak najszybciej!"
                }
            }
        ]
    };

    // Wysłanie powiadomienia przez webhook
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    })
    .then(response => {
        if (response.ok) {
            alert('Powiadomienie o zakończeniu czasu na sprawdzenie zostało wysłane!');
        } else {
            alert('Wystąpił błąd podczas wysyłania powiadomienia.');
        }
    })
    .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas wysyłania powiadomienia.');
    });
}

// Funkcja do wysyłania powiadomienia o mijającym czasie na sprawdzenie raportu
async function sendNotification() {
    const employee = document.getElementById('employee').value;
    const durationType = document.getElementById('duration-type').value;
    const durationAmount = parseInt(document.getElementById('duration-amount').value, 10);
    const reportDate = document.getElementById('report-date').value;

    if (!employee || !durationType || !durationAmount || !reportDate) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const formattedDate = new Date(reportDate).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const futureDate = new Date();
    if (durationType === 'godzin') {
        futureDate.setHours(futureDate.getHours() + durationAmount);
    } else if (durationType === 'dni') {
        futureDate.setDate(futureDate.getDate() + durationAmount);
    }
    futureDate.setDate(futureDate.getDate() + 1);
    futureDate.setHours(0, 0, 0, 0);

    const timestamp = Math.floor(futureDate.getTime() / 1000);
    const userId = getUserId(employee);
    const message = {
        content: `<@${userId}>`,
        embeds: [
            {
                title: "Przypomnienie o kończącym się terminie!",
                description: `Przypominam o sprawdzeniu raportów z **${formattedDate}**!`,
                color: 16737280,
                fields: [
                    {
                        name: "Do końca czasu:",
                        value: `<t:${timestamp}:R>`,
                        inline: true
                    }
                ],
                footer: {
                    text: "Proszę zakończyć sprawdzanie raportów jak najszybciej!"
                }
            }
        ]
    };

    fetch(webhookUrl, {
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

// Funkcja do wysyłania powiadomienia o zmianie w grafiku
async function sendShiftChangeNotification() {
    const replacedPerson = document.getElementById('replaced-person').value;
    const replacingPerson = document.getElementById('replacing-person').value;
    const scope = document.getElementById('scope').value;
    const scheduleReportDate = document.getElementById('schedule-report-date').value;

    if (!replacedPerson || !replacingPerson || !scope || !scheduleReportDate) {
        alert('Wypełnij wszystkie pola dla zmiany w grafiku!');
        return;
    }

    const formattedScheduleDate = new Date(scheduleReportDate).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const replacedUserId = getUserId(replacedPerson);
    const replacingUserId = getUserId(replacingPerson);
    const message = {
        content: `<@${replacingUserId}> przejmuje obowiązki za <@${replacedUserId}>`,
        embeds: [
            {
                title: "Zmiana w grafiku",
                description: `Zmiana obowiązków z dnia **${formattedScheduleDate}**.\n\n**Zakres sprawdzania raportów:**\n${scope}.`,
                color: 16777215,
                footer: {
                    text: "Proszę o zapoznanie się ze zmianą!"
                }
            }
        ]
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    })
    .then(response => {
        if (response.ok) {
            alert('Powiadomienie o zmianie w grafiku zostało wysłane!');
        } else {
            alert('Wystąpił błąd podczas wysyłania powiadomienia o zmianie w grafiku.');
        }
    })
    .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas wysyłania powiadomienia o zmianie w grafiku.');
    });
}
