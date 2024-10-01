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

// Połączenie z MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://matiwitkowski311:qkaXQmxTwfyc5ol0@cluster0.ter8xk2.mongodb.net/IREX'; // Użyj swojej URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Połączono z MongoDB'))
    .catch(err => console.error('Błąd połączenia z MongoDB:', err));

// Endpoint dla GET /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serwowanie index.html
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

// Endpoint do logowania
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Nieprawidłowe dane logowania');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Nieprawidłowe dane logowania');
        }

        // Logowanie informacji o zalogowanym użytkowniku
        console.log(`Użytkownik ${username} zalogował się o ${new Date().toLocaleString()}`);

        // Ustawienie username w sesji
        req.session.user = { username: user.username };

        // Zalogowany pomyślnie
        res.redirect('/strona-glowna.html');
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).send('Wystąpił błąd serwera');
    }
});

// Endpoint do pobrania username
app.get('/api/username', (req, res) => {
    if (req.session.user) {
        return res.json({ username: req.session.user.username });
    } else {
        return res.json({ username: null });
    }
});

// Zabezpieczone trasy
app.get('/strona-glowna.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'strona-glowna.html'));
});

app.get('/zarzadzanie-powiadomieniami.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'zarzadzanie-powiadomieniami.html'));
});

app.get('/grafik.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'grafik.html'));
});

// Endpoint do wylogowywania
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Wystąpił błąd przy wylogowywaniu.');
        }
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
cron.schedule('19 01 * * *', async () => { // Ustawione na codziennie o północy
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
cron.schedulval'19 01 * * *', async () => { // Ustawione na codziennie o północy
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


// Start serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
