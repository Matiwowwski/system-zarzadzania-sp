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
const webhookUrl = 'https://discord.com/api/webhooks/1299764781041062019/AduCrdUGtqYLfrqJiiYqltNW4TcoWqcSwaQ78iX0zU5jfo64qva6KUn2FCiJc8LWpE_E';

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
    'SP-106': '599682381913260034',
    'SP-107': '690559064773623818',
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

    // Sprawdzenie, czy jest 12:56 PM
    return hours === 12 && minutes === 0 && period === 'PM';
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

const sendNotification = async (employees, formattedDate, reportNumbers) => {
    if (!isCorrectTime()) {
        console.log('Nieprawidłowa godzina. Powiadomienie nie zostanie wysłane.');
        return;
    }

    try {
        // Oblicz datę powiadomienia na 23:00 dnia poprzedniego
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + 4);
        notificationDate.setHours(23, 0, 0, 0);

        const timestamp = Math.floor(notificationDate.getTime() / 1000);

        // Pinguj użytkowników wraz z zakresem sprawdzania raportów
        const userNotifications = employees.map((employee, index) => {
            const reportNumber = reportNumbers[index];
            return `<@${getUserId(employee)}> \`${reportNumber}\``;
        });

        const message = {
            content: userNotifications.join(', '),
            embeds: [
                {
                    title: "Powiadomienie!",
                    description: `Dzisiaj **(${formattedDate})** sprawdzacie raporty!`,
                    color: 3447003,
                    fields: [
                        {
                            name: "Termin mija:",
                            value: `<t:${timestamp}:R>`,
                            inline: true
                        }
                    ],
                    footer: { text: "Miłego dnia :)" }
                }
            ]
        };

        console.log('Wysyłam wiadomość:', JSON.stringify(message, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Wystąpił błąd: ${response.statusText} - ${errorText}`);
        }
        console.log('Wiadomość wysłana pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu wiadomości:', error);
    }
};

const sendDutyNotification = async (employees, formattedDate, tasks) => {
    if (!isCorrectTime()) {
        console.log('Nieprawidłowa godzina. Powiadomienie nie zostanie wysłane.');
        return;
    }

    try {
        const userIds = employees.map(employee => `<@${getUserId(employee)}>`);
        
        const notificationDate = new Date();
        notificationDate.setDate(notificationDate.getDate() + 4);
        notificationDate.setHours(23, 0, 0, 0);

        const timestamp = Math.floor(notificationDate.getTime() / 1000);

        const message = {
            content: userIds.join(', '),
            embeds: [
                {
                    title: "Powiadomienie o dyżurze!",
                    description: `Dzisiaj **(${formattedDate})** masz dyżur!`,
                    color: 3066993,
                    fields: tasks.map(task => ({
                        name: "Czas do końca dyżuru:",
                        value: `<t:${timestamp}:R>`,
                        inline: true
                    })),
                    footer: { text: "Miłego dnia :)" }
                }
            ]
        };

        console.log('Wysyłam wiadomość:', JSON.stringify(message, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Wystąpił błąd: ${response.statusText} - ${errorText}`);
        }
        console.log('Wiadomość wysłana pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu wiadomości:', error);
    }
};

// Funkcja do wysyłania przypomnień o kończącym się terminie
const sendReminder = async (employees, formattedDate, reportNumbers) => {
    if (!isCorrectTime()) {
        console.log('Nieprawidłowa godzina. Przypomnienie nie zostanie wysłane.');
        return;
    }

    try {
        const reminderDate = new Date();
        reminderDate.setUTCHours(23, 0, 0, 0);

        const timestamp = Math.floor(reminderDate.getTime() / 1000);

        // Pinguj użytkowników wraz z zakresem sprawdzania raportów
        const userReminders = employees.map((employee, index) => {
            const reportNumber = reportNumbers[index];
            return `<@${getUserId(employee)}> \`${reportNumber}\``;
        });

        const message = {
            content: userReminders.join(', '),
            embeds: [
                {
                    title: "Przypomnienie o kończącym się terminie!",
                    description: `Minęło 5 dni od daty **${formattedDate}**, przypominamy o sprawdzeniu raportów!`,
                    color: 16776960,
                    fields: [
                        {
                            name: "Pozostały czas na sprawdzenie:",
                            value: `<t:${timestamp}:R>`,
                            inline: true
                        }
                    ],
                    footer: { text: "Proszę zakończyć sprawdzanie raportów jak najszybciej!" }
                }
            ]
        };

        console.log('Wysyłam przypomnienie:', JSON.stringify(message, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Wystąpił błąd: ${response.statusText} - ${errorText}`);
        }
        console.log('Przypomnienie wysłane pomyślnie!');
    } catch (error) {
        console.error('Błąd przy wysyłaniu przypomnienia:', error);
    }
};

// Zaplanuj zadanie na każdą minutę w godzinach od 00:00 do 01:59 w polskim czasie
cron.schedule('* * * * *', async () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' });
    const [day, month, year] = formattedDate.split('.');
    const polishDateFormat = `${day}.${month}.${year}`;

    try {
        const workdays = await Workday.find({ date: polishDateFormat, task: 'sprawdzanieRaportów' });
        const dutyWorkdays = await Workday.find({ date: polishDateFormat, task: 'dyżur' });

        const reportGroups = {};
        const dutyGroups = {};

        // Grupa powiadomień o raportach
        workdays.forEach(workday => {
            if (!reportGroups[workday.date]) {
                reportGroups[workday.date] = { employees: [], reportNumbers: [] };
            }
            reportGroups[workday.date].employees.push(workday.employee);
            reportGroups[workday.date].reportNumbers.push(workday.reportNumber);
        });

        // Grupa powiadomień o dyżurach
        dutyWorkdays.forEach(workday => {
            if (!dutyGroups[workday.date]) {
                dutyGroups[workday.date] = { employees: [], tasks: [] };
            }
            dutyGroups[workday.date].employees.push(workday.employee);
            dutyGroups[workday.date].tasks.push(workday.task);
        });

        // Wysyłanie powiadomień dla grup raportów
        for (const date in reportGroups) {
            const { employees, reportNumbers } = reportGroups[date];
            await sendNotification(employees, polishDateFormat, reportNumbers);
        }

        // Wysyłanie powiadomień dla grup dyżurów
        for (const date in dutyGroups) {
            const { employees, tasks } = dutyGroups[date];
            await sendDutyNotification(employees, polishDateFormat, tasks);
        }

        const reminderDate = new Date();
        reminderDate.setDate(today.getDate() - 5);
        const formattedReminderDate = reminderDate.toLocaleDateString('pl-PL');

        const reminderWorkdays = await Workday.find({ date: formattedReminderDate, task: 'sprawdzanieRaportów' });

        const reminderGroups = {};

        // Grupa przypomnień o terminach
        reminderWorkdays.forEach(workday => {
            if (!reminderGroups[workday.date]) {
                reminderGroups[workday.date] = { employees: [], reportNumbers: [] };
            }
            reminderGroups[workday.date].employees.push(workday.employee);
            reminderGroups[workday.date].reportNumbers.push(workday.reportNumber);
        });

        // Wysyłanie przypomnień dla grup
        for (const date in reminderGroups) {
            const { employees, reportNumbers } = reminderGroups[date];
            await sendReminder(employees, formattedReminderDate, reportNumbers);
        }

    } catch (error) {
        console.error('Błąd podczas przetwarzania danych:', error);
    }
});

// Oznacz gotowość skryptu
console.log('Webhook do powiadomień jest gotowy!');

// Start serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
