const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cron = require('node-cron');
const Workday = require('./models/Workday');

// URL webhooka
const webhookUrl = 'https://discord.com/api/webhooks/1289269499853406351/M0kHaRGcwcufDc0isuzBl3cMmyOu8RNJfT-B49679xtv0KSxLzAEIKqzEXtQLLw0Suqz';

// Mapa użytkowników
const userMap = {
    'Matiw': '805745794010579015',
    'SA-100': '528230911507038208', 
    'SP-100': '665270450091458601', 
    'SP-101': '775738195241205770',
    'SP-102': '509475271871561734',
    'SP-103': '805745794010579015',
    'SP-104': '528618523308720149',
    'SP-105': '811164013026607145',
}

// Funkcja do pingowania użytkownika
const getUserId = (employee) => {
    return userMap[employee] || employee; // Zwraca ID użytkownika, lub nazwę, jeśli nie ma w mapie
};

// Funkcja do wysyłania powiadomień w formacie Discord Embed z pingiem pracownika
const sendNotification = async (employee, formattedDate, reportNumber) => {
    try {
        const userId = getUserId(employee); // Uzyskaj ID użytkownika
        const message = {
            content: `<@${userId}>`, // Ping użytkownika przez ID w formacie <@ID>
            embeds: [
                {
                    title: "Powiadomienie!",
                    description: `Dzisiaj **(${formattedDate})** sprawdzasz/cie raporty!`,
                    color: 3447003, // Kolor niebieski
                    fields: [
                        {
                            name: "Zakres sprawdzania:",
                            value: `${reportNumber}`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: "Miłego dnia :)"
                    }
                }
            ]
        };

        console.log('Wysyłam wiadomość:', JSON.stringify(message, null, 2)); // Loguj wiadomość przed wysłaniem

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`Wystąpił błąd: ${response.statusText}`);
        }
        console.log('Wiadomość wysłana pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu wiadomości:', error);
    }
};

// Zaplanuj zadanie na północ każdego dnia
cron.schedule('* * * * *', async () => { // Ustawione na codziennie o północy
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pl-PL'); // Użyj formatu polskiego

    try {
        // Znajdź wszystkie wpisy na dzisiaj, gdzie task to "sprawdzanieRaportów"
        const workdays = await Workday.find({ date: formattedDate, task: 'sprawdzanieRaportów' });
        console.log(`Znaleziono wpisy na dzień ${formattedDate} z zadaniem "sprawdzanieRaportów":`, workdays);

        if (workdays.length > 0) {
            for (const workday of workdays) {
                // Wyślij wiadomość pingując pracownika z embedem
                await sendNotification(workday.employee, formattedDate, workday.reportNumber);
            }
        } else {
            console.log('Brak zadań "sprawdzanieRaportów" na dzisiaj.');
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych z bazy:', error);
    }
});

// Funkcja do wysyłania przypomnień o kończącym się terminie
const sendReminder = async (employee, formattedDate, reportNumber) => {
    try {
        const userId = getUserId(employee); // Uzyskaj ID użytkownika
        const message = {
            content: `<@${userId}>`, // Ping użytkownika przez ID
            embeds: [
                {
                    title: "Przypomnienie o kończącym się terminie!",
                    description: `Minęło 5 dni od daty **${formattedDate}**, przypominamy o sprawdzeniu raportów!`,
                    color: 15158332, // Kolor czerwony
                    fields: [
                        {
                            name: "Zakres sprawdzania:",
                            value: `${reportNumber}`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: "Proszę zakończyć sprawdzanie raportów jak najszybciej!"
                    }
                }
            ]
        };

        console.log('Wysyłam przypomnienie:', JSON.stringify(message, null, 2)); // Loguj wiadomość przed wysłaniem

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`Wystąpił błąd: ${response.statusText}`);
        }
        console.log('Przypomnienie wysłane pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu przypomnienia:', error);
    }
};

// Zaplanuj przypomnienie na 5 dni po dacie zadania
cron.schedule('* * * * *', async () => { // Ustawione na codziennie o północy
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() - 5); // Ustaw datę na 5 dni przed dzisiejszą

    const formattedReminderDate = reminderDate.toLocaleDateString('pl-PL'); // Formatowanie daty przypomnienia

    try {
        // Znajdź wszystkie wpisy, gdzie task to "sprawdzanieRaportów", a data jest 5 dni wcześniej
        const workdays = await Workday.find({ date: formattedReminderDate, task: 'sprawdzanieRaportów' });
        console.log(`Znaleziono wpisy na ${formattedReminderDate} z zadaniem "sprawdzanieRaportów":`, workdays);

        if (workdays.length > 0) {
            for (const workday of workdays) {
                // Wyślij przypomnienie pingując pracownika
                await sendReminder(workday.employee, formattedReminderDate, workday.reportNumber);
            }
        } else {
            console.log(`Brak zadań "sprawdzanieRaportów" sprzed 5 dni (${formattedReminderDate}).`);
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych z bazy dla przypomnienia:', error);
    }
});


// Oznacz gotowość skryptu
console.log('Webhook do powiadomień jest gotowy!');

