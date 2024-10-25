const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const path = require('path'); // Importowanie path
const session = require('express-session'); // Importowanie express-session
const app = express();
const PORT = 5000;
const Workday = require('./models/Workday'); // Zakładając, że masz folder models i plik Workday.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cron = require('node-cron');
require('dotenv').config();

const cors = require('cors');
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Umożliwia serwowanie plików statycznych
app.use('/src', express.static(path.join(__dirname, 'src')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

// Inicjalizacja sesji
app.use(session({
    secret: 'sekretny_klucz',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware do sprawdzania, czy użytkownik jest zalogowany
function checkAuth(req, res, next) {
    if (req.session.user && req.session.user.username) {
        return next(); // Użytkownik jest zalogowany, przejdź do następnej funkcji
    } else {
        res.redirect('/index.html'); // Przekierowanie do index.html, jeśli nie jest zalogowany
    }
}

// Połączenie z MongoDB
const mongoURI = process.env.MONGO_URI; // Użyj swojej URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Połączono z MongoDB'))
    .catch(err => console.error('Błąd połączenia z MongoDB:', err));

// Endpoint dla GET /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serwowanie index.html
});

// Endpoint logowania
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Sprawdź, czy użytkownik istnieje w bazie danych
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Nieprawidłowe dane logowania');
        }

        // Porównaj hasło podane przez użytkownika z hasłem w bazie danych
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Nieprawidłowe dane logowania');
        }

        // Logowanie informacji o zalogowanym użytkowniku
        console.log(`Użytkownik ${username} zalogował się o ${new Date().toLocaleString()}`);

        // Ustawienie username w sesji
        req.session.user = { username: user.username }; // Ustawienie username w sesji

        // Zalogowany pomyślnie
        res.redirect('/strona-glowna.html'); // Przekierowanie po udanym logowaniu
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).send('Wystąpił błąd serwera');
    }
});

app.get('/api/username', (req, res) => {
    if (req.session.user) {
        return res.json({ username: req.session.user.username });
    } else {
        return res.json({ username: null });
    }
});

// Endpoint wylogowania
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Błąd podczas wylogowania:', err);
            return res.status(500).send('Wystąpił błąd podczas wylogowania');
        }
        // Przekierowanie do strony głównej po wylogowaniu
        res.redirect('/index.html');
    });
});

// Endpoint rejestracji
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).send('Użytkownik zarejestrowany pomyślnie');
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        res.status(500).send('Wystąpił błąd serwera');
    }
});

// Endpoint do dodawania dni pracy
app.post('/workdays', async (req, res) => {
    const { date, employee, task, details, leaveType, reportNumber, cellId } = req.body;

    const newWorkday = new Workday({
        date,
        employee,
        task,
        details,
        leaveType,
        reportNumber,
        cellId
    });

    try {
        await newWorkday.save();

        // Logowanie dodanego dnia pracy
        console.log(`Dodano nowy dzień pracy w grafiku: ${date}, pracownik: ${employee}, zadanie: ${task}, komórka ID: ${cellId}`);

        res.status(201).send('Workday saved successfully');
    } catch (error) {
        console.error('Error saving workday:', error);
        res.status(500).send('Error saving workday');
    }
});

// Endpoint do pobierania dni pracy
app.get('/workdays', async (req, res) => {
    try {
        const workdays = await Workday.find(); // Pobranie wszystkich dni pracy z bazy danych
        res.status(200).json(workdays); // Zwrócenie danych w formacie JSON
    } catch (error) {
        console.error('Error fetching workdays:', error);
        res.status(500).send('Error fetching workdays');
    }
});

// Endpoint do aktualizacji workday
app.put('/workdays/:id', async (req, res) => {
    const { id } = req.params; // id z URL
    const updatedData = req.body; // Zaktualizowane dane

    try {
        const workday = await Workday.findByIdAndUpdate(id, updatedData, { new: true });
        if (!workday) {
            return res.status(404).send({ message: 'Nie znaleziono dnia pracy.' });
        }
        res.send(workday);
    } catch (error) {
        console.error('Błąd podczas aktualizacji:', error);
        res.status(500).send({ message: 'Wystąpił problem z aktualizacją danych.' });
    }
});

// Endpoint do usuwania danych
app.delete('/workdays/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Usunięcie dokumentu na podstawie _id
        const deletedWorkday = await Workday.deleteOne({ _id: id });

        if (deletedWorkday.deletedCount === 0) {
            return res.status(404).json({ message: 'Dzień roboczy nie został znaleziony.' });
        }

        res.status(200).json({ message: 'Dzień roboczy usunięty pomyślnie.' });
    } catch (error) {
        console.error('Błąd podczas usuwania:', error);
        res.status(500).json({ message: 'Błąd podczas usuwania danych.' });
    }
});

// URL webhooka
const webhookUrl = 'https://discord.com/api/webhooks/1289269499853406351/M0kHaRGcwcufDc0isuzBl3cMmyOu8RNJfT-B49679xtv0KSxLzAEIKqzEXtQLLw0Suqz';

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
}

// Funkcja do pingowania użytkownika
const getUserId = (employee) => {
    return userMap[employee] || employee; // Zwraca ID użytkownika, lub nazwę, jeśli nie ma w mapie
};

const isCorrectTime = () => {
    // Pobranie aktualnej daty i godziny w formacie 12-godzinnym z AM/PM dla strefy 'Europe/Warsaw'
    const now = new Date().toLocaleString('en-US', {
        timeZone: 'Europe/Warsaw',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    // Rozbijanie godziny na godzinę, minutę i AM/PM
    const [time, period] = now.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    console.log(`Aktualny czas w Warszawie: ${hours}:${minutes} ${period}`);

    // Sprawdzenie, czy jest 12:45 AM (co odpowiada 00:45 w formacie 24-godzinnym)
    return hours === 8 && minutes === 41 && period === 'PM';
};

// Zaplanuj zadanie na każdą minutę od północy do 1 w nocy
cron.schedule('* * * * *', async () => {
    if (isCorrectTime()) {
        // Twoja logika do wykonania, gdy czas to 00:45
        console.log('Czas jest 00:45, wykonaj akcję.');
    } else {
        console.log('Czas nie jest 00:45, akcja nie zostanie wykonana.');
    }
});

// Testowanie funkcji isCorrectTime
console.log(isCorrectTime());  // Sprawdza, czy funkcja działa poprawnie (wyświetli true tylko o 15:32 w Polsce)

const sendNotification = async (employee, formattedDate, reportNumber) => {
    if (!isCorrectTime()) {
        console.log('Nieprawidłowa godzina. Powiadomienie nie zostanie wysłane.');
        return;
    }

    try {
        const userId = getUserId(employee); // Uzyskaj ID użytkownika
        
        // Oblicz datę na 22:00 dnia poprzedniego
        const futureDate = new Date();
        futureDate.setUTCDate(futureDate.getUTCDate() + 5); // Ustaw datę na 5 dni do przodu
        futureDate.setHours(0, 0, 0, 0); // Ustaw godziny, minuty, sekundy i milisekundy na 00:00

        // Oblicz datę powiadomienia na 22:00 dnia poprzedniego
        const notificationDate = new Date(futureDate);
        notificationDate.setUTCDate(notificationDate.getUTCDate() - 1); // Ustaw datę na dzień wstecz
        notificationDate.setHours(22, 0, 0, 0); // Ustaw godziny na 22:00

        const timestamp = Math.floor(notificationDate.getTime() / 1000); // Zmień na timestamp powiadomienia

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
                        },
                        {
                            name: "Termin mija:",
                            value: `<t:${timestamp}:R>`, // Timestamp na 22:00 dnia poprzedniego
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
            const errorText = await response.text(); // Pobierz tekst błędu
            throw new Error(`Wystąpił błąd: ${response.statusText} - ${errorText}`);
        }
        console.log('Wiadomość wysłana pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu wiadomości:', error);
    }
};


// Zaplanuj zadanie na każdą minutę w godzinach od 00:00 do 01:59 w polskim czasie
cron.schedule('* * * * *', async () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }); // Użyj formatu polskiego z czasem w Warszawie
    const [day, month, year] = formattedDate.split('.'); // Rozdziel datę na dzień, miesiąc i rok
    const polishDateFormat = `${day}.${month}.${year}`; // Stwórz format DD.MM.YYYY // Stwórz format YYYY-MM-DD

    try {
        // Znajdź wszystkie wpisy na dzisiaj, gdzie task to "sprawdzanieRaportów"
        const workdays = await Workday.find({ date: polishDateFormat, task: 'sprawdzanieRaportów' });
        console.log(`Znaleziono wpisy na dzień ${polishDateFormat} z zadaniem "sprawdzanieRaportów":`, workdays);

        if (workdays.length > 0) {
            for (const workday of workdays) {
                // Wyślij wiadomość pingując pracownika
                await sendNotification(workday.employee, polishDateFormat, workday.reportNumber);
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
    if (!isCorrectTime()) {
        console.log('Nieprawidłowa godzina. Przypomnienie nie zostanie wysłane.');
        return;
    }

    try {
        const userId = getUserId(employee); // Uzyskaj ID użytkownika

        // Oblicz datę na 22:00 dnia dzisiejszego
        const reminderDate = new Date();
        reminderDate.setUTCHours(22, 0, 0, 0); // Ustaw godziny na 22:00 UTC

        const timestamp = Math.floor(reminderDate.getTime() / 1000); // Użyj reminderDate do konwersji na sekundy

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
                        },
                        {
                            name: "Termin mija:",
                            value: `<t:${timestamp}:R>`, // Timestamp na 22:00 dnia dzisiejszego
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
            const errorText = await response.text(); // Pobierz tekst błędu
            throw new Error(`Wystąpił błąd: ${response.statusText} - ${errorText}`);
        }
        console.log('Przypomnienie wysłane pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu przypomnienia:', error);
    }
};

// Zaplanuj przypomnienie na 5 dni po dacie zadania, ale wysyłaj tylko o 15:20
cron.schedule('* * * * *', async () => {
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
                // Wyślij przypomnienie pingując pracownika, jeśli jest 15:20
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

// Start serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
