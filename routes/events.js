const express = require('express');
const Event = require('../models/Event');
const router = express.Router();

// Pobierz wszystkie wydarzenia
router.get('/', async (req, res) => {
    const events = await Event.find();
    res.json(events);
});

// Dodaj nowe wydarzenie
router.post('/', async (req, res) => {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.json(newEvent);
});

module.exports = router;
