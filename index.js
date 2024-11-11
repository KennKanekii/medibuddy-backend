// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Patient = require('./model/Patient'); 
const Doctor = require('./model/Doctor'); 
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors')
const natural = require("natural");
const app = express();
const PORT = process.env.PORT || 5000;

const symptomsList  = ['back_pain','constipation','abdominal_pain','diarrhoea','mild_fever','yellow_urine',
    'yellowing_of_eyes','acute_liver_failure','fluid_overload','swelling_of_stomach',
    'swelled_lymph_nodes','malaise','blurred_and_distorted_vision','phlegm','throat_irritation',
    'redness_of_eyes','sinus_pressure','runny_nose','congestion','chest_pain','weakness_in_limbs',
    'fast_heart_rate','pain_during_bowel_movements','pain_in_anal_region','bloody_stool',
    'irritation_in_anus','neck_pain','dizziness','cramps','bruising','obesity','swollen_legs',
    'swollen_blood_vessels','puffy_face_and_eyes','enlarged_thyroid','brittle_nails',
    'swollen_extremeties','excessive_hunger','extra_marital_contacts','drying_and_tingling_lips',
    'slurred_speech','knee_pain','hip_joint_pain','muscle_weakness','stiff_neck','swelling_joints',
    'movement_stiffness','spinning_movements','loss_of_balance','unsteadiness',
    'weakness_of_one_body_side','loss_of_smell','bladder_discomfort','foul_smell_of urine',
    'continuous_feel_of_urine','passage_of_gases','internal_itching','toxic_look_(typhos)',
    'depression','irritability','muscle_pain','altered_sensorium','red_spots_over_body','belly_pain',
    'abnormal_menstruation','dischromic _patches','watering_from_eyes','increased_appetite','polyuria','family_history','mucoid_sputum',
    'rusty_sputum','lack_of_concentration','visual_disturbances','receiving_blood_transfusion',
    'receiving_unsterile_injections','coma','stomach_bleeding','distention_of_abdomen',
    'history_of_alcohol_consumption','fluid_overload','blood_in_sputum','prominent_veins_on_calf',
    'palpitations','painful_walking','pus_filled_pimples','blackheads','scurring','skin_peeling',
    'silver_like_dusting','small_dents_in_nails','inflammatory_nails','blister','red_sore_around_nose',
    'yellow_crust_ooze']


// Middleware
app.use(cors());
app.use(bodyParser.json());
console.log(process.env.mongoURI)

function extractSymptoms(sentence) {
    // Tokenize the sentence into words using the natural tokenizer
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(sentence.toLowerCase());

    // Join the words with underscores to create a normalized string
    const sentenceNormalized = words.join("_");

    // List to store the matched symptoms
    const matchedSymptoms = [];

    // Check each symptom in the list for a match
    symptomsList.forEach((symptom) => {
        if (sentenceNormalized.includes(symptom.toLowerCase())) {
            matchedSymptoms.push(symptom);
        }
    });

    return matchedSymptoms;
}




// Routes

// POST


app.post('/nlp',(req,res)=>{
    console.log(req.body);
    const {symtext} = req.body;
    arrSymptoms = extractSymptoms(symtext);
    res.status(200).send(arrSymptoms);
})



//GET

app.post('/api/new', async (req, res) => {

    const newDoctor = new Doctor({
        name:"Adeca",
        slots:[]
    });

    newDoctor.save()
        .then(() => res.json('Doctor added!'))
        .catch((err) => res.status(400).json('Error: ' + err));
});


app.get('/api/doctors', async (req, res) => {
    
    Doctor.find()
        .then((doctors) => {console.log(doctors);
        res.json(doctors)})
        .catch((err) => res.status(400).json('Error: ' + err));
});

app.get('/', (req, res) => {
    res.send("Welcome to the Patient Record Management System");
});

app.post('/api/patients', async (req, res) => {
    try {
        const { name, age, gender } = req.body.userInfo;
        const symptomsArray = req.body.symptomsArray;
        // Create a new patient document
        console.log("see here")
        const obj = {
            "symptoms" : symptomsArray,
        }
        console.log(obj);
        const response = await fetch('https://disease-prediction-model-9pc1.onrender.com/predict', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(obj),
                });

        const {predicted_disease} = await response.json();
        console.log(predicted_disease);

        const newPatient = new Patient({
            name,
            age,
            gender,
            symptoms:symptomsArray,
            predictedDisease : predicted_disease
        });


        // Save the patient to the database
        await newPatient.save();
        res.status(201).json({
            id: newPatient._id,  // Send back the generated ID
            predictedDisease: predicted_disease
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Example route to create a new patient
app.post('/bookSlot', async (req, res) => {
    try {
        console.log("1");
        console.log(req.body);
        const { doctorid, time, patientid } = req.body;
        // const symptomsArray = req.body.symptomsArray;
        // Create a new patient document

        const doctor = await Doctor.findOneAndUpdate(
            {
                _id: doctorid,
                'slots.time': time // Find the slot with the matching time
            },
            {
                $set: {
                    'slots.$.isBooked': true,       // Update isBooked to true
                    'slots.$.patientId': patientid  // Set patientId to the provided patient ID
                }
            },
            { new: true } // Return the updated document
        );
    
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor or slot not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server


mongoose.connect(process.env.mongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
