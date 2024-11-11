const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slots: [{
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String, // You can use a string or Date here depending on your time format
            required: true
        },
        isBooked: {
            type: Boolean,
            default: false // To track if a slot has been booked
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId, // Reference to the patient who booked the slot
            ref: 'Patient'
        }
    }]

}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Doctor', doctorSchema);
