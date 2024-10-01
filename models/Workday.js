const mongoose = require('mongoose');

const workdaySchema = new mongoose.Schema({
    date: { type: String, required: true },
    employee: { type: String, required: true },
    task: { type: String, required: true },
    details: { type: String },
    leaveType: { type: String },
    reportNumber: { type: String },
    cellId: { type: String, required: true }  // Dodane pole dla ID komórki
});

const Workday = mongoose.model('Workday', workdaySchema);
module.exports = Workday;
